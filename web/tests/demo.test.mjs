import test from 'node:test'
import assert from 'node:assert/strict'
import { initialData, decideRecommendation, recordMovement, lowStock, registerSupplier, saveSupplierOffer } from '../src/demo.js'

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

