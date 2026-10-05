// Deterministic demand planning; the browser demo does not call an AI provider.
const DAY = 86400000
const MAX = 99999999.99
const cents = value => Math.round(Number(value) * 100)
const quantity = value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= MAX && Math.abs(Number(value) * 100 - cents(value)) < 0.000001
const ceilRatio = (amount, days, divisor) => Number((BigInt(amount) * BigInt(days) + BigInt(divisor - 1)) / BigInt(divisor)) / 100

export function demandEvidence(data, itemId, now = new Date().toISOString()) {
  const item = data.items.find(i => i.id === itemId)
  if (!item) throw new Error('Inventory item not found.')
  const end = Date.parse(now)
  if (!Number.isFinite(end)) throw new Error('Invalid analysis date.')
  const start = end - 28 * DAY
  const usage = data.movements.filter(m => m.itemId === itemId && m.type === 'Use' && Date.parse(m.createdAt) >= start && Date.parse(m.createdAt) <= end)
    .reduce((sum, m) => sum + cents(m.quantity), 0) / 100
  const historyComplete = Number.isFinite(Date.parse(item.createdAt)) && Date.parse(item.createdAt) <= start
  const incoming = data.purchases.filter(p => p.itemId === itemId && ['Pending', 'Approved'].includes(p.status)).reduce((sum, p) => sum + cents(p.quantity), 0) / 100
  return { usage, historyComplete, incoming, asOf: now }
}

export function calculateDemand(data, itemId, settings = {}, now = new Date().toISOString()) {
  const evidence = demandEvidence(data, itemId, now)
  const item = data.items.find(i => i.id === itemId)
  const safetyDays = Number(settings.safetyDays ?? 7)
  if (!Number.isInteger(safetyDays) || safetyDays < 0 || safetyDays > 90) throw new Error('Safety days must be a whole number from 0 to 90.')
  const historical = evidence.historyComplete && evidence.usage > 0
  const estimate = settings.weeklyEstimate
  if (!historical && (estimate == null || String(estimate).trim() === '' || !quantity(estimate) || Number(estimate) <= 0)) {
    throw new Error('Enter a positive weekly usage estimate until 28 days of usable history are available.')
  }
  const amount = cents(historical ? evidence.usage : estimate)
  const divisor = historical ? 28 : 7
  const source = historical ? 'Recorded usage over 28 days' : 'Manager weekly estimate'
  const offers = data.suppliers.flatMap(s => s.offers.filter(o => o.itemId === itemId && o.isAvailable).map(o => {
    const reorderPoint = Math.max(item.minimumStockLevel, ceilRatio(amount, o.leadTimeDays + safetyDays, divisor))
    const targetStock = Math.max(item.minimumStockLevel, ceilRatio(amount, Math.max(30, o.leadTimeDays) + safetyDays, divisor))
    const orderQuantity = Math.max(0, cents(targetStock) - cents(item.currentStock) - cents(evidence.incoming)) / 100
    return { ...o, supplierId: s.id, supplierName: s.name, reorderPoint, targetStock, quantity: orderQuantity,
      due: item.currentStock <= reorderPoint && orderQuantity > 0,
      shortageRisk: cents(item.currentStock) * divisor < amount * o.leadTimeDays,
      withinLimit: targetStock <= MAX && orderQuantity <= MAX }
  }))
  return { ...evidence, source, safetyDays, weeklyEstimate: historical ? null : Number(estimate),
    averageWeekly: ceilRatio(amount, 7, divisor), monthlyUsage: ceilRatio(amount, 30, divisor),
    safetyStock: ceilRatio(amount, safetyDays, divisor), offers }
}

export function proposeDemand(data, itemId, supplierId, settings, id, now = new Date().toISOString()) {
  if (data.recommendations.some(r => r.itemId === itemId && r.status === 'Pending')) throw new Error('Review or reject the existing pending recommendation first.')
  if (data.recommendations.some(r => r.id === id)) throw new Error('Recommendation ID already exists.')
  const demand = calculateDemand(data, itemId, settings, now)
  const offer = demand.offers.find(o => o.supplierId === supplierId)
  if (!offer?.due || !offer.withinLimit) throw new Error('This supplier does not currently need a valid reorder.')
  const item = data.items.find(i => i.id === itemId)
  const record = { id, itemId, supplierId, quantity: offer.quantity, unitPrice: offer.unitPrice, leadTimeDays: offer.leadTimeDays,
    stockAtProposal: item.currentStock, minimumAtProposal: item.minimumStockLevel, status: 'Pending', note: '',
    model: 'Deterministic demand demo', demand: { ...demand, offers: undefined, ...offer },
    reason: `${demand.source}: ${demand.averageWeekly.toFixed(2)} per week, ${demand.monthlyUsage.toFixed(2)} per 30 days. Safety buffer ${demand.safetyDays} days (${demand.safetyStock.toFixed(2)}). Reorder point ${offer.reorderPoint.toFixed(2)}; target ${offer.targetStock.toFixed(2)}; incoming ${demand.incoming.toFixed(2)}. Delivery is a ${offer.leadTimeDays}-day estimate.${offer.shortageRisk ? ' Stock may run out before delivery; contact the supplier.' : ''}` }
  return { ...data, recommendations: [record, ...data.recommendations] }
}

export function validateDemandApproval(data, record, now) {
  if (!record.demand) return
  const fresh = calculateDemand(data, record.itemId, record.demand, now)
  const offer = fresh.offers.find(o => o.supplierId === record.supplierId)
  if (fresh.source !== record.demand.source || fresh.usage !== record.demand.usage || fresh.incoming !== record.demand.incoming || !offer?.due || offer.quantity !== record.quantity || offer.reorderPoint !== record.demand.reorderPoint) {
    throw new Error('Demand or incoming orders changed. Reject this recommendation and calculate a fresh plan.')
  }
}
