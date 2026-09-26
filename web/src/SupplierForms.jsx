import { useState } from 'react'
import { money, registerSupplier, saveSupplierOffer } from './demo'

export function SupplierForm({ data, onSave, onCancel }) {
  const [error, setError] = useState('')
  function submit(event) {
    event.preventDefault()
    try { onSave(registerSupplier(data, Object.fromEntries(new FormData(event.currentTarget)), crypto.randomUUID())) }
    catch (err) { setError(err.message) }
  }
  return <form onSubmit={submit}>
    <label>Supplier name<input name="name" required maxLength={100} placeholder="e.g. Valley Farm Supplies" /></label>
    <label>Contact person (optional)<input name="contactPerson" maxLength={100} /></label>
    <div className="form-row"><label>Email (optional)<input name="email" type="email" maxLength={150} /></label><label>Phone (optional)<input name="phone" type="tel" maxLength={20} /></label></div>
    <label>Address (optional)<textarea name="address" maxLength={250} rows={2} /></label>
    <p className="form-hint">Register contact details here. Add prices separately for each inventory item through Supplier offers.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="button subtle" onClick={onCancel}>Cancel</button><button className="button primary">Register demo supplier</button></div>
  </form>
}

export function SupplierOffers({ data, itemId, onSave, onRegister }) {
  const [editor, setEditor] = useState(null)
  const [error, setError] = useState('')
  const item = data.items.find(i => i.id === itemId)
  const linked = data.suppliers.filter(s => s.offers.some(o => o.itemId === itemId))
  const unlinked = data.suppliers.filter(s => !s.offers.some(o => o.itemId === itemId))
  function submit(event) {
    event.preventDefault()
    const v = Object.fromEntries(new FormData(event.currentTarget))
    try {
      onSave(saveSupplierOffer(data, itemId, editor.supplierId || v.supplierId, { ...v, isAvailable: v.isAvailable === 'true' }, Boolean(editor.supplierId)))
      setEditor(null); setError('')
    } catch (err) { setError(err.message) }
  }
  if (editor) {
    const supplier = data.suppliers.find(s => s.id === editor.supplierId)
    const offer = supplier?.offers.find(o => o.itemId === itemId)
    return <form key={editor.supplierId || 'new'} onSubmit={submit}>
      <h3 className="offer-editor-title">{supplier ? `Edit ${supplier.name}` : 'Add supplier offer'}</h3>
      {!supplier && <label>Registered supplier<select name="supplierId" required defaultValue=""><option value="" disabled>Select a supplier</option>{unlinked.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      <div className="form-row"><label>Price per {item.unitOfMeasurement} (LKR)<input name="unitPrice" type="number" required min="0" max="99999999.99" step="0.01" defaultValue={offer?.unitPrice ?? ''} /></label><label>Estimated delivery (days)<input name="leadTimeDays" type="number" required min="0" max="2147483647" step="1" defaultValue={offer?.leadTimeDays ?? ''} /></label></div>
      <label>Availability<select name="isAvailable" defaultValue={String(offer?.isAvailable ?? true)}><option value="true">Available</option><option value="false">Unavailable</option></select></label>
      <p className="form-hint">This price applies only to this supplier and item. Updating an offer leaves existing recommendation snapshots unchanged; changed evidence may block approval.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button subtle" onClick={() => { setEditor(null); setError('') }}>Back to offers</button><button className="button primary">Save demo offer</button></div>
    </form>
  }
  return <div>
    <p className="form-hint">Compare prices per {item.unitOfMeasurement}. Each registered supplier has its own price, delivery estimate and availability.</p>
    {!linked.length && <div className="empty"><h3>No supplier offers yet</h3><p>Link a registered supplier to compare prices for this item.</p></div>}
    <div className="item-offers">{linked.map(s => {
      const o = s.offers.find(offer => offer.itemId === itemId)
      return <article key={s.id}><div className="item-offer-heading"><strong>{s.name}</strong><span className={`badge ${o.isAvailable ? 'healthy' : 'rejected'}`}>{o.isAvailable ? 'Available' : 'Unavailable'}</span></div><div className="item-offer-details"><span>{money(o.unitPrice)} / {item.unitOfMeasurement}<small>{o.leadTimeDays} days estimated delivery</small></span><button className="button subtle compact" aria-label={`Edit offer from ${s.name}`} onClick={() => setEditor({ supplierId: s.id })}>Edit offer</button></div></article>
    })}</div>
    {!linked.some(s => s.offers.find(o => o.itemId === itemId).isAvailable) && <p className="form-hint">There are no available offers for this item. The agent needs an available supplier before it can recommend a purchase.</p>}
    <div className="modal-actions"><button className="button subtle" onClick={onRegister}>Register another supplier</button><button className="button primary" disabled={!unlinked.length} onClick={() => setEditor({})}>Add supplier offer</button></div>
    {!unlinked.length && <p className="form-hint">All registered suppliers are already linked. Register another supplier to add a new offer.</p>}
  </div>
}
