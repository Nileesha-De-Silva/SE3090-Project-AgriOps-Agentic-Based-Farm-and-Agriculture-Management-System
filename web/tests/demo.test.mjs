import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateDemand, proposeDemand } from '../src/demand.js'
import { initialData, decideRecommendation, recordMovement, lowStock, registerSupplier, updateSupplier, saveSupplierOffer, updateInventoryItem } from '../src/demo.js'

const demandNow = '2026-09-27T12:00:00Z'
function demandFixture() {
  const data = initialData()
  data.items[0] = { ...data.items[0], currentStock: 28, minimumStockLevel: 20, createdAt: '2026-08-01T00:00:00Z' }
  data.recommendations = []
  data.movements = [{ id: 'use', itemId: 'fertilizer', type: 'Use', quantity: 56, createdAt: '2026-09-20T12:00:00Z' }]
  return data
}

test('demand forecasts 30 days from four-week usage and reorders before fixed minimum', () => {
  const plan = calculateDemand(demandFixture(), 'fertilizer', {}, demandNow)
  assert.equal(plan.averageWeekly, 14)
  assert.equal(plan.monthlyUsage, 60)
  assert.equal(plan.safetyStock, 14)
  const slow = plan.offers.find(o => o.supplierId === 'green')
  assert.equal(slow.reorderPoint, 28)
  assert.equal(slow.targetStock, 74)
  assert.equal(slow.quantity, 36) // 74 - 28 - 10 incoming
  assert.equal(slow.due, true)
  assert.equal(plan.offers.find(o => o.supplierId === 'harvest').due, false)
})

test('demand ignores receipts, future usage and usage outside the 28-day window', () => {
  const data = demandFixture()
  data.movements.push(...[
    ['Receive', '2026-09-25T12:00:00Z'], ['Use', '2026-08-01T00:00:00Z'], ['Use', '2026-09-28T00:00:00Z'],
  ].map(([type, createdAt]) => ({ itemId: 'fertilizer', type, createdAt, quantity: 500 })))
  assert.equal(calculateDemand(data, 'fertilizer', {}, demandNow).usage, 56)
})

test('short or zero-use history requires a validated manager estimate', () => {
  const data = demandFixture()
  data.items[0].createdAt = demandNow
  assert.throws(() => calculateDemand(data, 'fertilizer', {}, demandNow), /weekly usage estimate/)
  for (const weeklyEstimate of ['', 0, -1, 'NaN', '14.001']) {
    assert.throws(() => calculateDemand(data, 'fertilizer', { weeklyEstimate }, demandNow))
  }
  const plan = calculateDemand(data, 'fertilizer', { weeklyEstimate: '7' }, demandNow)
  assert.equal(plan.source, 'Manager weekly estimate')
  assert.equal(plan.monthlyUsage, 30)
  data.items[0].createdAt = '2026-08-01T00:00:00Z'
  data.movements = []
  assert.throws(() => calculateDemand(data, 'fertilizer', {}, demandNow), /weekly usage estimate/)
})

test('demand handles incoming coverage, delivery risk, long lead times and rounding', () => {
  const data = demandFixture()
  data.items[0].currentStock = 1
  data.purchases[0].quantity = 1000
  const plan = calculateDemand(data, 'fertilizer', {}, demandNow)
  assert.equal(plan.offers[0].due, false)
  assert.equal(plan.offers[0].quantity, 0)
  assert.equal(plan.offers[0].shortageRisk, true)
  data.purchases = []
  data.movements[0].quantity = 1
  data.items[0].minimumStockLevel = 0
  data.suppliers[0].offers[0].leadTimeDays = 40
  const slow = calculateDemand(data, 'fertilizer', {}, demandNow).offers[0]
  assert.equal(slow.targetStock, 1.68) // ceil(1 / 28 * 47, 2)
  assert.equal(slow.quantity, 0.68)
  assert.throws(() => calculateDemand(data, 'fertilizer', { safetyDays: 91 }, demandNow))
})

test('demand proposal waits for approval, blocks duplicates and preserves stock', () => {
  const original = demandFixture()
  const data = proposeDemand(original, 'fertilizer', 'green', {}, 'DEMAND-1', demandNow)
  assert.equal(original.recommendations.length, 0)
  assert.equal(data.purchases.length, 1)
  assert.throws(() => proposeDemand(data, 'fertilizer', 'green', {}, 'DEMAND-2', demandNow), /pending recommendation/)
  const approved = decideRecommendation(data, 'DEMAND-1', true, '', demandNow)
  assert.equal(approved.purchases.length, 2)
  assert.equal(approved.purchases[0].quantity, 36)
  assert.equal(approved.items[0].currentStock, 28)
  assert.throws(() => decideRecommendation(approved, 'DEMAND-1', true, '', demandNow), /already/)
})

test('changing usage or incoming orders blocks demand approval but allows rejection', () => {
  for (const change of ['usage', 'incoming']) {
    const data = proposeDemand(demandFixture(), 'fertilizer', 'green', {}, 'DEMAND-1', demandNow)
    if (change === 'usage') data.movements[0].quantity = 60
    else data.purchases[0].quantity = 11
    assert.throws(() => decideRecommendation(data, 'DEMAND-1', true, '', demandNow), /Demand or incoming orders changed/)
    assert.equal(decideRecommendation(data, 'DEMAND-1', false, '', demandNow).purchases.length, 1)
  }
})

test('inventory edits preserve stock, suppliers and recommendation snapshots', () => {
  const data = initialData()
  const changed = updateInventoryItem(data, 'fertilizer', { ...data.items[0], name: 'New fertilizer name', minimumStockLevel: '25', unitCost: '135.50', currentStock: 999 })
  assert.equal(changed.items[0].currentStock, 5)
  assert.equal(changed.items[0].unitCost, 135.5)
  assert.deepEqual(changed.suppliers, data.suppliers)
  assert.deepEqual(changed.recommendations, data.recommendations)
  assert.equal(data.items[0].name, 'Organic fertilizer')
  assert.throws(() => decideRecommendation(changed, 'REC-001', true, ''), /Stock or supplier details changed/)
})

test('inventory units can change only on unused zero-stock items', () => {
  const data = initialData()
  assert.throws(() => updateInventoryItem(data, 'fertilizer', { ...data.items[0], unitOfMeasurement: 'litres' }), /unit cannot change/)
  const unused = { ...data.items[0], id: 'unused', currentStock: 0 }
  data.items.push(unused)
  assert.equal(updateInventoryItem(data, 'unused', { ...unused, unitOfMeasurement: 'units' }).items.at(-1).unitOfMeasurement, 'units')
  assert.throws(() => updateInventoryItem(recordMovement(data, 'unused', 'Receive', 1, '', 'receipt'), 'unused', { ...unused, unitOfMeasurement: 'units' }), /unit cannot change/)
})

test('inventory edits reject invalid fields without mutating records', () => {
  const data = initialData()
  for (const fields of [{ name: ' ' }, { category: '' }, { unitOfMeasurement: '' }, { minimumStockLevel: -1 }, { unitCost: 1.001 }, { unitCost: '' }, { minimumStockLevel: Infinity }]) {
    assert.throws(() => updateInventoryItem(data, 'fertilizer', { ...data.items[0], ...fields }))
  }
  assert.equal(data.items[0].unitCost, 120)
})

test('approval creates exactly one purchase and leaves stock unchanged', () => {
  const before = initialData()
  const after = decideRecommendation(before, 'REC-001', true, 'Reviewed')
  assert.equal(after.purchases.length, before.purchases.length + 1)
  assert.equal(after.purchases[0].quantity, 35)
  assert.equal(after.purchases[0].recommendationId, 'REC-001')
  assert.deepEqual(after.items, before.items)
  assert.throws(() => decideRecommendation(after, 'REC-001', true, ''), /already been decided/)
  assert.equal(before.recommendations[0].status, 'Pending')
})
test('rejection records a note without creating a purchase', () => {
  const before = initialData()
  const after = decideRecommendation(before, 'REC-001', false, '  Delivery too slow  ')
  assert.deepEqual(after.purchases, before.purchases)
  assert.equal(after.recommendations[0].note, 'Delivery too slow')
  assert.equal(after.recommendations[0].status, 'Rejected')
})
test('stock movement blocks stale approval but permits rejection', () => {
  const changed = recordMovement(initialData(), 'fertilizer', 'Receive', 1, '', 'test')
  assert.throws(() => decideRecommendation(changed, 'REC-001', true, ''), /Stock or supplier details changed/)
  assert.equal(decideRecommendation(changed, 'REC-001', false, '').recommendations[0].status, 'Rejected')
})
test('supplier price or availability change blocks approval', () => {
  for (const change of [{ unitPrice: 130 }, { isAvailable: false }, { leadTimeDays: 20 }]) {
    const data = initialData()
    Object.assign(data.suppliers[0].offers[0], change)
    assert.throws(() => decideRecommendation(data, 'REC-001', true, ''), /Stock or supplier details changed/)
  }
})
test('movements preserve decimal precision and reject invalid stock', () => {
  let data = recordMovement(initialData(), 'fertilizer', 'Use', '4.90', 'Used', 'one')
  data = recordMovement(data, 'fertilizer', 'Receive', '0.20', 'Received', 'two')
  assert.equal(data.items[0].currentStock, 0.3)
  assert.equal(data.movements.length, 2)
  assert.throws(() => recordMovement(data, 'fertilizer', 'Use', 1, '', 'three'), /more than/)
  for (const value of [-1, 0, 0.001, 'bad', Infinity]) assert.throws(() => recordMovement(data, 'fertilizer', 'Receive', value, '', 'invalid'))
})
test('threshold matches backend and reset returns fresh sample objects', () => {
  assert.equal(lowStock({ currentStock: 20, minimumStockLevel: 20 }), false)
  assert.equal(lowStock({ currentStock: 19.99, minimumStockLevel: 20 }), true)
  const data = initialData()
  data.items[0].currentStock = 1000
  assert.equal(initialData().items[0].currentStock, 5)
})

test('register supplier then link independent offers without changing valuation', () => {
  const original = initialData()
  const registered = registerSupplier(original, { name: ' Valley Supplies ', email: 'valley@example.com' }, 'valley')
  assert.equal(registered.suppliers.at(-1).name, 'Valley Supplies')
  assert.equal(registered.suppliers.at(-1).offers.length, 0)
  const linked = saveSupplierOffer(registered, 'fertilizer', 'valley', { unitPrice: '99.95', leadTimeDays: '4', isAvailable: true })
  assert.equal(linked.suppliers.at(-1).offers[0].unitPrice, 99.95)
  assert.equal(linked.suppliers[0].offers[0].unitPrice, 120)
  assert.deepEqual(linked.items, original.items)
  assert.throws(() => saveSupplierOffer(linked, 'fertilizer', 'valley', { unitPrice: 1, leadTimeDays: 1, isAvailable: true }), /already has an offer/)
})
test('offer edits preserve snapshots and prevent stale approvals', () => {
  const original = initialData()
  const edited = saveSupplierOffer(original, 'fertilizer', 'green', { unitPrice: 130, leadTimeDays: 5, isAvailable: false }, true)
  assert.deepEqual(edited.recommendations, original.recommendations)
  assert.equal(edited.suppliers[0].offers.length, original.suppliers[0].offers.length)
  assert.equal(original.suppliers[0].offers[0].isAvailable, true)
  assert.throws(() => decideRecommendation(edited, 'REC-001', true, ''), /Stock or supplier details changed/)
  assert.equal(decideRecommendation(edited, 'REC-001', false, '').recommendations[0].status, 'Rejected')
})
test('invalid suppliers, offers and input are rejected', () => {
  const data = initialData()
  assert.throws(() => registerSupplier(data, { name: '   ' }, 'test'))
  assert.throws(() => registerSupplier(data, { name: 'Test', email: 'bad' }, 'test'))
  const valid = { unitPrice: 20, leadTimeDays: 2, isAvailable: true }
  assert.throws(() => saveSupplierOffer(data, 'fertilizer', 'missing', valid))
  assert.throws(() => saveSupplierOffer(data, 'missing', 'rural', valid))
  for (const unitPrice of ['', -1, 1.001, Infinity, 100000000]) assert.throws(() => saveSupplierOffer(data, 'fertilizer', 'rural', { ...valid, unitPrice }))
  for (const leadTimeDays of ['', -1, 1.5, Infinity]) assert.throws(() => saveSupplierOffer(data, 'fertilizer', 'rural', { ...valid, leadTimeDays }))
  const zero = saveSupplierOffer(data, 'fertilizer', 'rural', { unitPrice: 0, leadTimeDays: 0, isAvailable: false })
  assert.equal(zero.suppliers[2].offers.at(-1).unitPrice, 0)
})
test('supplier contact edits preserve supplied inventory and offers', () => {
  const original = initialData()
  const updated = updateSupplier(original, 'green', { name: ' Greenfield Co-op ', contactPerson: 'New contact', email: 'new@example.com', phone: '+94 70 000 0000', address: 'New address' })
  assert.equal(updated.suppliers[0].name, 'Greenfield Co-op')
  assert.equal(updated.suppliers[0].contactPerson, 'New contact')
  assert.deepEqual(updated.suppliers[0].offers, original.suppliers[0].offers)
  assert.deepEqual(updated.items, original.items)
  assert.throws(() => updateSupplier(updated, 'green', { name: 'x', email: 'invalid' }))
})

