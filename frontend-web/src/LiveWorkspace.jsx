import inventoryWarehouse from "./assets/inventory-warehouse.jpg"
import { useEffect, useRef, useState } from 'react'

import { createApiSession } from './api'

import { Link } from 'react-router-dom'

import { useAuth } from './contexts/authcontext'

import { getToken } from './services/authToken'

import { money } from './demo'

import AskAgent from './AskAgent'

import DecimalInput from './DecimalInput'

import InventoryItemForm from './InventoryItemForm'
import InventoryBatchPanel, { BatchQrLabel } from './InventoryBatchPanel'

import { SupplierForm, SupplierOffers } from './SupplierForms'

import { MoreHorizontal, Search, Package, Truck, ShieldCheck, SlidersHorizontal, Sparkles, ChevronRight } from 'lucide-react'

import './styles/inventory-ui.css'



const empty = () => ({ items: [], suppliers: [], movements: [], recommendations: [], purchases: [] })

const formatNumber = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0))

function LiveDialog({ title, busy, onClose, children }) {

  const ref = useRef(null)

  useEffect(() => { ref.current.showModal() }, [])

  return <dialog ref={ref} onCancel={event => { if (busy) event.preventDefault(); else onClose() }} aria-labelledby="live-dialog-title">

    <div className="modal-head"><h2 id="live-dialog-title">{title}</h2><button className="button subtle" disabled={busy} onClick={onClose}>Close</button></div>

    <fieldset disabled={busy}>{children}</fieldset>

  </dialog>

}



export default function LiveWorkspace() {

  const { user, loading } = useAuth()

  if (loading) return <p role="status">Checking your session…</p>

  if (!user) return <main className="live-workspace"><h1>Inventory</h1><Link to="/login">Sign in to view inventory</Link></main>

  return <InventoryWorkspace key={user.id} />

}



function InventoryWorkspace() {

  const [session] = useState(() => createApiSession())

  const lock = useRef(false)

  const api = session.api

  const [data, setData] = useState(empty)

  const [loaded, setLoaded] = useState(false)

  const [manager, setManager] = useState(false)

  const [busy, setBusy] = useState(false)

  const [stale, setStale] = useState(false)

  const [error, setError] = useState('')

  const [notice, setNotice] = useState('')

  const [page, setPage] = useState('inventory')

  const [modal, setModal] = useState(null)

  const [search, setSearch] = useState('')

  const [permissions, setPermissions] = useState({ canManage: false, canUse: false, canReceive: false })

  // Component-local credentials disappear with this instance on unmount.

  // StrictMode cleanup must not clear a token while connection is in flight.

  const item = id => data.items.find(i => i.id === id)

  const supplier = id => data.suppliers.find(s => s.id === id)

  const canWrite = loaded && manager && !stale && !busy

  const canMove = loaded && permissions.canUse && !stale && !busy



  async function refresh() {

    try { const next = await api.loadWorkspace(manager); setData(next); setStale(false); return next }

    catch (err) { setStale(true); if ([401, 403].includes(err.status)) { setManager(false); session.clearToken() }; throw err }

  }

  async function connect() {

    if (lock.current) return

    const supplied = getToken() || ''

    lock.current = true; setBusy(true); setError(''); setNotice(''); setManager(false)

    setData(empty()); setLoaded(false); setModal(null); session.setToken(supplied)

    try {

      const access = await api.inventorySession()

      setPermissions(access)

      const next = await api.loadWorkspace(access.canManage === true)

      setData(next); setLoaded(true); setManager(access.canManage === true); setStale(false)

    } catch (err) { session.clearToken(); setError(err.message) }

    finally { lock.current = false; setBusy(false) }

  }

  useEffect(() => { void connect() }, [])

  async function reload() {

    if (lock.current) return

    lock.current = true; setBusy(true); setError('')

    try { await refresh(); setNotice('Live records refreshed.') }

    catch (err) { setError(err.message) }

    finally { lock.current = false; setBusy(false) }

  }

  async function mutate(action, message, stockAction = false) {

    if (!(stockAction ? canMove : canWrite) || lock.current) throw new Error('Connect manager access and refresh the workspace first.')

    lock.current = true; setBusy(true); setError(''); setNotice('')

    try {

      await action()

      setModal(null); setNotice(message)

      try { await refresh() }

      catch { setError('The save completed, but refreshing failed. Use Refresh records before making another change.') }

    } catch (err) {

      if (err.uncertain) {

        setStale(true); setModal(null)

        setError('The response was interrupted; the change may have saved. Refresh and inspect the records before retrying. For a stock movement, check its history.')

      } else {

        if ([401, 403].includes(err.status)) { setManager(false); session.clearToken() }

        setError(err.message)

        throw err

      }

    } finally { lock.current = false; setBusy(false) }

  }

  const newItem = { id: 'new-item', name: '', category: 'Other', unitOfMeasurement: 'kg', currentStock: 0, minimumStockLevel: 0, unitCost: 0 }

  const editData = modal?.type === 'add-item' ? { ...data, items: [...data.items, newItem] } : data

  const filteredItems = data.items.filter(i => `${i.name} ${i.category}`.toLowerCase().includes(search.toLowerCase()))

  return <main className="live-workspace">

    <div className="inventory-breadcrumb">Workspace <ChevronRight size={14} aria-hidden="true" /> Inventory &amp; supply</div>

    <header className="page-heading"><div><h1>Inventory management</h1><p>Stock, suppliers and purchasing — together in one place.</p></div></header>

    {error && <div className="form-error" role="alert"><p>{error}</p>{!loaded && <button className="button subtle" disabled={busy} onClick={connect}>Try again</button>}</div>}

    {notice && <p className="demand-note" role="status">{notice}</p>}

    {busy && <p role="status">{loaded ? 'Updating inventory…' : 'Loading your inventory…'}</p>}

    {loaded && <>

      <section className="inventory-hero" aria-labelledby="inventory-hero-title" style={{ backgroundImage: `linear-gradient(90deg, rgba(5,28,22,.92), rgba(5,28,22,.68) 55%, rgba(5,28,22,.24)), url(${inventoryWarehouse})` }}>
        <span className="inventory-hero-label"><Package size={16} aria-hidden="true" /> Inventory &amp; supply</span>
        <h2 id="inventory-hero-title">Stock, suppliers and reorders in one place</h2>
        <p>Review reorder recommendations before purchasing. Record deliveries and usage to keep stock up to date.</p>
      </section>
      <div className="inventory-summary" aria-label="Inventory overview">

        {[{ label: 'Inventory items', value: data.items.length, icon: Package },

          { label: 'Below minimum', value: data.items.filter(i => Number(i.currentStock) < Number(i.minimumStockLevel)).length, icon: SlidersHorizontal },

          { label: 'Suppliers', value: data.suppliers.length, icon: Truck },

          ...(manager ? [{ label: 'Awaiting approval', value: data.recommendations.filter(r => r.status === 'Pending').length, icon: ShieldCheck }] : [])

        ].map(({ label, value, icon: Icon }) => <article className="inventory-summary-card" key={label}><div><span>{label}</span><Icon size={20} aria-hidden="true" /></div><strong>{value}</strong></article>)}

      </div>

      <div className="live-actions"><nav aria-label="Live workspace navigation">{['inventory', 'suppliers', ...(manager ? ['recommendations', 'purchases', 'agent'] : [])].map(p => <button className={`button ${page === p ? 'primary' : 'subtle'}`} key={p} disabled={busy} aria-current={page === p ? 'page' : undefined} onClick={() => { setPage(p); setSearch('') }}>{p === 'agent' && <Sparkles size={16} aria-hidden="true" />}{p === 'agent' ? 'Ask Agent' : p.charAt(0).toUpperCase() + p.slice(1)}</button>)}</nav><button className="button subtle" disabled={busy} onClick={reload}>Refresh records</button></div>

      {stale && <p className="demand-note">Editing is paused until records refresh successfully.</p>}

      {page === 'inventory' && <section className="panel">

        <div className="panel-heading"><h2>Inventory</h2>{manager && <button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'add-item' })}>Add item</button>}</div>

        <label className="live-search"><span className="search-label"><Search aria-hidden="true" size={16} /> Search inventory</span><input placeholder="Search by item or category" value={search} onChange={e => setSearch(e.target.value)} /></label>

        <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Item</th><th className="numeric-cell">Stock / minimum</th><th className="numeric-cell">Valuation</th><th className="actions-cell">Actions</th></tr></thead><tbody>{filteredItems.map(i => <tr key={i.id}>

          <td><span className="item-name">{i.name}</span><small className="cell-small">{i.category}</small></td><td className="numeric-cell"><span>{formatNumber(i.currentStock)} / {formatNumber(i.minimumStockLevel)} {i.unitOfMeasurement}</span>{Number(i.currentStock) < Number(i.minimumStockLevel) && <span className="stock-low">Low stock</span>}</td><td className="numeric-cell">{money(i.unitCost)}</td>

          <td className="actions-cell"><details className="actions-menu"><summary className="button subtle" aria-label={`Actions for ${i.name}`}><MoreHorizontal size={17} aria-hidden="true" /></summary><div className="actions-menu-popover">{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'edit-item', id: i.id })}>Edit item</button>}{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'offers', id: i.id })}>Supplier offers</button>}{permissions.canUse && <button className="button subtle" disabled={!canMove} onClick={() => setModal({ type: 'movement', id: i.id })}>Record movement</button>}<button className="button subtle" disabled={busy} onClick={() => setModal({ type: 'history', id: i.id })}>History</button><button className="button subtle" disabled={busy} onClick={() => setModal({ type: 'batches', id: i.id })}>Batches & QR labels</button></div></details></td>

        </tr>)}</tbody></table></div>{!filteredItems.length && <p className="empty">{data.items.length ? 'No inventory items match your search.' : 'No inventory items in the database.'}</p>}

      </section>}

      {page === 'suppliers' && <section className="panel"><div className="panel-heading"><div><h2>Supplier directory</h2><p className="form-hint">{data.suppliers.length} registered suppliers</p></div>{manager && <button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'supplier' })}>Register supplier</button>}</div><div className="supplier-grid">{data.suppliers.map(s => <article className="supplier-card" key={s.id}>

        <h3>{s.name}</h3><p>{s.contactPerson || 'No contact person'}</p><p>{s.email || 'No email'} · {s.phone || 'No phone'}</p><p>{s.address || 'No address'}</p>

        <div className="contact-actions">{s.phone && <a className="button subtle" href={`tel:${s.phone.replace(/\s/g, '')}`}>Call supplier</a>}{s.email && <a className="button subtle" href={`mailto:${s.email}`}>Email supplier</a>}{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'supplier', id: s.id })}>Edit contact details</button>}</div>

        <p className="form-hint">Supplies: {s.offers.map(o => item(o.itemId)?.name || 'Unknown item').join(', ') || 'No linked items'}. Edit offers from Inventory.</p>

      </article>)}</div></section>}

      {page === 'recommendations' && <section className="panel"><div className="panel-heading"><div><h2>Manager review</h2><p className="form-hint">Human approval required · Stock stays unchanged</p></div><ShieldCheck size={25} aria-hidden="true" /></div>{!manager && <p className="empty">Connect a manager token to load recommendations.</p>}<div className="recommendation-list">{data.recommendations.map(r => <article className="recommendation" key={r.id}>

        <span className="recommendation-id">{r.status} · {r.model}</span><h3>{item(r.itemId)?.name || 'Inventory item'}</h3><p>{r.quantity} {r.unitOfMeasurement} from {supplier(r.supplierId)?.name || 'Supplier'}</p><p>{money(r.estimatedCost)} · {r.leadTimeDays} days estimated delivery</p><div className="reason"><p>{r.reason}</p></div>

        {r.demand && <details className="demand-details"><summary>Demand calculation</summary><p>Weekly usage: {r.demand.averageWeeklyUsage} · 30-day usage: {r.demand.monthlyUsage}</p><p>Safety stock: {r.demand.safetyStock} · Incoming: {r.demand.incomingQuantity}</p><p>Target: {r.demand.targetStock} · Reorder point: {r.demand.reorderPoint}</p>{r.demand.shortageRisk && <p className="demand-warning">Current stock may run out before estimated delivery.</p>}</details>}

        {r.status === 'Pending' && <div className="review-actions"><button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'decision', record: r, approve: false })}>Reject</button><button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'decision', record: r, approve: true })}>Review & approve</button></div>}

        {r.note && <p>{r.note}</p>}

      </article>)}</div>{manager && !data.recommendations.length && <p className="empty">No saved recommendations. Open Ask Agent to request one.</p>}</section>}

      {page === 'purchases' && <section className="panel"><div className="panel-heading"><div><h2>Purchase requests</h2><p className="form-hint">Approval creates a request. Stock changes only after receipt.</p></div></div>{!manager ? <p className="empty">Connect a manager token to load purchases.</p> : <div className="table-scroll"><table><thead><tr><th>Item</th><th>Supplier</th><th>Quantity</th><th>Status</th><th>Receipt</th><th>Batch label</th></tr></thead><tbody>{data.purchases.map(p => <tr key={p.id}><td>{item(p.itemId)?.name || p.itemId}</td><td>{supplier(p.supplierId)?.name || p.supplierId}</td><td>{p.quantity}</td><td>{p.status}</td><td>{p.status === 'Approved' && permissions.canReceive ? <button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'receipt', record: p })}>Record receipt</button> : p.status === 'Received' ? 'Receipt recorded' : '—'}</td><td>{['Approved', 'Received'].includes(p.status) && <button className="button subtle" onClick={() => setModal({ type: 'batch-label', id: p.id })}>Print QR label</button>}</td></tr>)}</tbody></table></div>}<p className="form-hint live-search">After delivery, use Record receipt to confirm the full quantity and update stock. Contact the supplier separately to arrange your order.</p></section>}

      <section className="panel live-agent-panel" hidden={page !== 'agent'}><div className="inventory-agent-heading"><span className="inventory-icon"><Sparkles size={25} aria-hidden="true" /></span><div><h2>Ask Inventory Agent</h2><p className="form-hint">Plan a reorder for the next 30 days</p></div></div><div className="inventory-agent-layout"><div><AskAgent data={data} api={api} enabled={manager && !stale} onSaved={refresh} onBusy={setBusy} /></div><aside className="inventory-agent-guide"><ShieldCheck size={28} aria-hidden="true" /><h3>Human decisions, always</h3><ol><li>Request a recommendation</li><li>Review and approve</li><li>Record goods received</li></ol><p>Recommendations do not send supplier orders or make payments.</p></aside></div></section>

    </>}

    {modal && <LiveDialog title={modal.type === 'decision' ? `${modal.approve ? 'Approve' : 'Reject'} recommendation?` : modal.type === 'offers' ? 'Supplier offers' : modal.type.replaceAll('-', ' ')} busy={busy} onClose={() => setModal(null)}>

      {['edit-item', 'add-item'].includes(modal.type) && <InventoryItemForm data={editData} itemId={modal.id || newItem.id} onCancel={() => setModal(null)} onSubmitValues={values => mutate(() => api.saveItem(modal.id, values), 'Item saved to the database.')} />}

      {modal.type === 'supplier' && <SupplierForm data={data} supplierId={modal.id} onCancel={() => setModal(null)} onSubmitValues={values => mutate(() => api.saveSupplier(modal.id, values), 'Supplier saved to the database.')} />}

      {modal.type === 'offers' && <SupplierOffers data={data} itemId={modal.id} onRegister={() => setModal({ type: 'supplier' })} onSubmitValues={(supplierId, values, editing) => mutate(() => api.saveOffer(supplierId, modal.id, values, editing), 'Supplier offer saved.')} />}

      {modal.type === 'movement' && <form onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); mutate(() => api.recordMovement(modal.id, values), 'Stock movement saved.', true).catch(() => {}) }}>

        <p>{item(modal.id)?.name} · Current stock: {item(modal.id)?.currentStock}</p><label>Movement<select name="type">{permissions.canReceive && <option value="Receive">Receive stock</option>}<option value="Use">Use stock</option></select></label><label>Quantity<DecimalInput name="quantity" min="0.01" max="99999999.99" required /></label><label>Notes<textarea name="notes" maxLength={500} /></label><details><summary>Batch details (Receive stock only)</summary><label>Actual expiration date<input name="expirationDate" type="date" max="9999-12-31" /></label><label>Batch / lot number<input name="batchNumber" maxLength={100} /></label><label>Shelf location<input name="shelfLocation" maxLength={100} /></label></details><p className="form-hint">Use stock follows FIFO: the oldest received available batches first. Check Batches & QR labels before physically issuing goods.</p><button className="button primary">Save movement</button>

      </form>}

      {modal.type === 'receipt' && <form onSubmit={event => { event.preventDefault(); const details = Object.fromEntries(new FormData(event.currentTarget)); const notes = String(details.notes || ''); mutate(() => api.receivePurchase(modal.record.id, notes, details), 'Receipt recorded. Stock updated and purchase request closed.', true).catch(() => {}) }}>
        <h3>{item(modal.record.itemId)?.name}</h3><p>Supplier: {supplier(modal.record.supplierId)?.name}</p>
        <p><strong>Quantity to receive: {modal.record.quantity} {item(modal.record.itemId)?.unitOfMeasurement}</strong></p>
        <p className="form-hint">Confirm the complete delivery matches this request. This adds the quantity to stock and marks the purchase request Received. For a partial or incorrect delivery, leave the request open.</p>
        <div className="form-row"><label>Actual batch / lot number<input name="batchNumber" maxLength={100} /></label><label>Shelf location<input name="shelfLocation" maxLength={100} /></label></div>
        <label>Actual expiration date (optional)<input name="expirationDate" type="date" max="9999-12-31" /></label>
        <p className="form-hint">Check the received packaging. This date belongs to this batch and is separate from the supplier offer date. Leave blank only when there is no known expiration date.</p>
        <label>Receipt reference / notes<textarea name="notes" maxLength={400} placeholder="Supplier receipt number or delivery notes" /></label>
        <label><span><input type="checkbox" required style={{ width: 'auto', minHeight: 'auto', marginRight: 8 }} />I checked the item and full quantity received.</span></label>
        <button className="button primary">Confirm receipt and update stock</button>
      </form>}
      {modal.type === 'batches' && <InventoryBatchPanel api={api} itemId={modal.id} canManage={canWrite} />}
      {modal.type === 'batch-label' && <BatchQrLabel api={api} batchId={modal.id} canManage={canWrite} />}
      {modal.type === 'history'  && <div className="history">{data.movements.filter(m => m.itemId === modal.id).map(m => <article key={m.id}><strong>{m.type}: {m.quantity}</strong><small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.notes}</p></article>)}{!data.movements.some(m => m.itemId === modal.id) && <p>No movements recorded.</p>}</div>}

      {modal.type === 'decision' && <form onSubmit={event => { event.preventDefault(); const note = String(new FormData(event.currentTarget).get('note') || ''); mutate(() => api.decide(modal.record.id, modal.approve, note), modal.approve ? 'Approved. One purchase request was created; stock is unchanged.' : 'Recommendation rejected.').catch(() => {}) }}>

        <p>{modal.record.quantity} {modal.record.unitOfMeasurement} · {money(modal.record.estimatedCost)}</p><p className="form-hint">{modal.approve ? 'This creates a real purchase request in the database. It does not send an order or change stock.' : 'This closes the recommendation without a purchase request.'}</p><label>Decision note<textarea name="note" maxLength={500} /></label><button className="button primary">{modal.approve ? 'Approve recommendation' : 'Reject recommendation'}</button>

      </form>}

      {error && <p className="form-error" role="alert">{error}</p>}

    </LiveDialog>}

  </main>

}

