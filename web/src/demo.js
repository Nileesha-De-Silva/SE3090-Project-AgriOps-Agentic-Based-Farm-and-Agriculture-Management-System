// Synthetic UI fixtures. No credentials, API calls or real farm records.
export const money = value => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(value)
export const lowStock = item => item.currentStock < item.minimumStockLevel
export function initialData() {
  return {
    items: [
      { id: 'fertilizer', name: 'Organic fertilizer', category: 'Fertilizer', unitOfMeasurement: 'kg', currentStock: 5, minimumStockLevel: 20, unitCost: 120 },
      { id: 'seeds', name: 'Paddy seeds', category: 'Seeds', unitOfMeasurement: 'kg', currentStock: 42, minimumStockLevel: 25, unitCost: 280 },
      { id: 'compost', name: 'Compost', category: 'Fertilizer', unitOfMeasurement: 'kg', currentStock: 180, minimumStockLevel: 100, unitCost: 45 },
      { id: 'neem', name: 'Neem oil', category: 'Crop protection', unitOfMeasurement: 'litres', currentStock: 3, minimumStockLevel: 10, unitCost: 950 },
      { id: 'trays', name: 'Seedling trays', category: 'Equipment', unitOfMeasurement: 'units', currentStock: 30, minimumStockLevel: 15, unitCost: 180 },
      { id: 'feed', name: 'Poultry feed', category: 'Feed', unitOfMeasurement: 'kg', currentStock: 0, minimumStockLevel: 50, unitCost: 210 },
    ],
    suppliers: [
      { id: 'green', name: 'Greenfield Supplies', initials: 'GS', contactPerson: 'Amali Perera', email: 'greenfield@example.com', phone: '+94 77 123 4567', address: '42 Farm Road, Kandy', offers: [
        { itemId: 'fertilizer', unitPrice: 120, leadTimeDays: 7, isAvailable: true },
        { itemId: 'compost', unitPrice: 45, leadTimeDays: 3, isAvailable: true },
        { itemId: 'seeds', unitPrice: 280, leadTimeDays: 4, isAvailable: true },
      ] },
      { id: 'harvest', name: 'Harvest Direct', initials: 'HD', contactPerson: 'Nimal Silva', email: 'harvest@example.com', phone: '+94 71 234 5678', address: '18 Market Street, Dambulla', offers: [
        { itemId: 'fertilizer', unitPrice: 150, leadTimeDays: 2, isAvailable: true },
        { itemId: 'neem', unitPrice: 950, leadTimeDays: 3, isAvailable: true },
      ] },
      { id: 'rural', name: 'Rural Agri Mart', initials: 'RA', contactPerson: 'Kavindi Fernando', email: 'rural@example.com', phone: '+94 76 345 6789', address: '7 Cooperative Lane, Kurunegala', offers: [
        { itemId: 'feed', unitPrice: 210, leadTimeDays: 4, isAvailable: true },
        { itemId: 'trays', unitPrice: 180, leadTimeDays: 5, isAvailable: false },
      ] },
    ],
    recommendations: [
      { id: 'REC-001', itemId: 'fertilizer', supplierId: 'green', quantity: 35, unitPrice: 120, leadTimeDays: 7, stockAtProposal: 5, minimumAtProposal: 20, status: 'Pending', reason: 'The lower-priced offer saves LKR 1,050 for 35 kg compared with Harvest Direct. The tradeoff is an estimated seven-day delivery instead of two days. Check your farm’s urgency before approving.', model: 'Synthetic demo fixture', note: '' },
      { id: 'REC-002', itemId: 'neem', supplierId: 'harvest', quantity: 17, unitPrice: 950, leadTimeDays: 3, stockAtProposal: 3, minimumAtProposal: 10, status: 'Pending', reason: 'This sample proposal replenishes neem oil to 20 litres. Harvest Direct has an available offer with a configured three-day delivery estimate. Confirm the required quantity before approving.', model: 'Synthetic demo fixture', note: '' },
    ],
    purchases: [{ id: 'PR-001', itemId: 'fertilizer', supplierId: 'harvest', quantity: 10, status: 'Approved', recommendationId: null, createdAt: '2026-09-25T08:00:00Z' }],
    movements: [],
  }
}

// Pure transitions keep UI behavior testable and make a future API adapter straightforward.
export function decideRecommendation(data, id, approve, note, now = new Date().toISOString()) {
  const record = data.recommendations.find(r => r.id === id)
  if (!record || record.status !== 'Pending') throw new Error('This recommendation has already been decided or is unavailable.')
  const item = data.items.find(i => i.id === record.itemId)
  const offer = data.suppliers.find(s => s.id === record.supplierId)?.offers.find(o => o.itemId === record.itemId)
  if (approve && (!offer?.isAvailable || item.currentStock !== record.stockAtProposal || item.minimumStockLevel !== record.minimumAtProposal || offer.unitPrice !== record.unitPrice || offer.leadTimeDays !== record.leadTimeDays)) {
    throw new Error('Stock or supplier details changed. Reject this stale recommendation and request a fresh analysis after backend integration.')
  }
  const purchaseId = approve ? `PR-${id}` : null
  return { ...data,
    recommendations: data.recommendations.map(r => r.id === id ? { ...r, status: approve ? 'Approved' : 'Rejected', note: note.trim(), decidedAt: now, purchaseId } : r),
    purchases: approve ? [{ id: purchaseId, itemId: record.itemId, supplierId: record.supplierId, quantity: record.quantity, status: 'Approved', recommendationId: id, createdAt: now }, ...data.purchases] : data.purchases,
  }
}

export function recordMovement(data, itemId, type, quantity, notes, id, now = new Date().toISOString()) {
  const item = data.items.find(i => i.id === itemId)
  const amount = Math.round(Number(quantity) * 100)
  if (!item || !['Receive', 'Use'].includes(type) || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || Math.abs(Number(quantity) * 100 - amount) > 0.000001) throw new Error('Enter a positive quantity with up to two decimal places.')
  const stock = Math.round(item.currentStock * 100) + (type === 'Receive' ? amount : -amount)
  if (stock < 0) throw new Error('You cannot use more than the current stock.')
  if (stock > 9999999999) throw new Error('This movement would exceed the stock limit.')
  return { ...data, items: data.items.map(i => i.id === itemId ? { ...i, currentStock: stock / 100 } : i), movements: [{ id, itemId, type, quantity: amount / 100, notes: notes.trim(), createdAt: now }, ...data.movements] }
}

export function registerSupplier(data, values, id) {
  const name = values.name.trim()
  if (!name || name.length > 100) throw new Error('Enter a supplier name of up to 100 characters.')
  const supplier = { id, name, initials: name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase(), offers: [] }
  for (const [field, limit] of Object.entries({ contactPerson: 100, email: 150, phone: 20, address: 250 })) {
    supplier[field] = (values[field] || '').trim()
    if (supplier[field].length > limit) throw new Error(`${field} is too long.`)
  }
  if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) throw new Error('Enter a valid email address.')
  return { ...data, suppliers: [...data.suppliers, supplier] }
}

export function saveSupplierOffer(data, itemId, supplierId, values, editing = false) {
  if (!data.items.some(i => i.id === itemId)) throw new Error('Inventory item not found.')
  const supplier = data.suppliers.find(s => s.id === supplierId)
  if (!supplier) throw new Error('Select a registered supplier.')
  const existing = supplier.offers.some(o => o.itemId === itemId)
  if (existing !== editing) throw new Error(existing ? 'This supplier already has an offer. Edit the existing offer.' : 'Offer not found.')
  const price = Number(values.unitPrice), days = Number(values.leadTimeDays)
  if (String(values.unitPrice).trim() === '' || !Number.isFinite(price) || price < 0 || price > 99999999.99 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) throw new Error('Enter a price from 0 to 99999999.99 with up to two decimal places.')
  if (String(values.leadTimeDays).trim() === '' || !Number.isInteger(days) || days < 0 || days > 2147483647) throw new Error('Delivery days must be a nonnegative whole number.')
  if (typeof values.isAvailable !== 'boolean') throw new Error('Choose an availability status.')
  const offer = { itemId, unitPrice: price, leadTimeDays: days, isAvailable: values.isAvailable }
  return { ...data, suppliers: data.suppliers.map(s => s.id === supplierId ? { ...s, offers: editing ? s.offers.map(o => o.itemId === itemId ? offer : o) : [...s.offers, offer] } : s) }
}
