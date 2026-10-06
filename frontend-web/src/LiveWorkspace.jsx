import { useEffect, useRef, useState } from 'react'
import { createApiSession } from './api'
import { Link } from 'react-router-dom'
import { useAuth } from './contexts/authcontext'
import { getToken } from './services/authToken'
import { money } from './demo'
import AskAgent from './AskAgent'
import DecimalInput from './DecimalInput'
import InventoryItemForm from './InventoryItemForm'
import { SupplierForm, SupplierOffers } from './SupplierForms'
import { MoreHorizontal, Search } from 'lucide-react'

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
  useEffect(() => () => session.clearToken(), [session])
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
    <header className="page-heading"><div><h1>Inventory</h1><p>Check stock levels, suppliers and recent movements.</p></div></header>
    {error && <div className="form-error" role="alert"><p>{error}</p>{!loaded && <button className="button subtle" disabled={busy} onClick={connect}>Try again</button>}</div>}
    {notice && <p className="demand-note" role="status">{notice}</p>}
    {busy && <p role="status">{loaded ? 'Updating inventory…' : 'Loading your inventory…'}</p>}
    {loaded && <>
      <div className="live-actions"><nav aria-label="Live workspace navigation">{['inventory', 'suppliers', ...(manager ? ['recommendations', 'purchases', 'agent'] : [])].map(p => <button className={`button ${page === p ? 'primary' : 'subtle'}`} key={p} disabled={busy} onClick={() => { setPage(p); setSearch('') }}>{p === 'agent' ? 'Ask Agent' : p.charAt(0).toUpperCase() + p.slice(1)}</button>)}</nav><button className="button subtle" disabled={busy} onClick={reload}>Refresh records</button></div>
      {stale && <p className="demand-note">Editing is paused until records refresh successfully.</p>}
      {page === 'inventory' && <section className="panel">
        <div className="panel-heading"><h2>Inventory</h2>{manager && <button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'add-item' })}>Add item</button>}</div>
        <label className="live-search"><span className="search-label"><Search aria-hidden="true" size={16} /> Search inventory</span><input placeholder="Search by item or category" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <div className="table-scroll"><table className="inventory-table"><thead><tr><th>Item</th><th className="numeric-cell">Stock / minimum</th><th className="numeric-cell">Valuation</th><th className="actions-cell">Actions</th></tr></thead><tbody>{filteredItems.map(i => <tr key={i.id}>
          <td><span className="item-name">{i.name}</span><small className="cell-small">{i.category}</small></td><td className="numeric-cell"><span>{formatNumber(i.currentStock)} / {formatNumber(i.minimumStockLevel)} {i.unitOfMeasurement}</span>{Number(i.currentStock) < Number(i.minimumStockLevel) && <span className="stock-low">Low stock</span>}</td><td className="numeric-cell">{money(i.unitCost)}</td>
          <td className="actions-cell"><details className="actions-menu"><summary className="button subtle" aria-label={`Actions for ${i.name}`}><MoreHorizontal size={17} aria-hidden="true" /></summary><div className="actions-menu-popover">{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'edit-item', id: i.id })}>Edit item</button>}{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'offers', id: i.id })}>Supplier offers</button>}{permissions.canUse && <button className="button subtle" disabled={!canMove} onClick={() => setModal({ type: 'movement', id: i.id })}>Record movement</button>}<button className="button subtle" disabled={busy} onClick={() => setModal({ type: 'history', id: i.id })}>History</button></div></details></td>
        </tr>)}</tbody></table></div>{!filteredItems.length && <p className="empty">{data.items.length ? 'No inventory items match your search.' : 'No inventory items in the database.'}</p>}
      </section>}
      {page === 'suppliers' && <section className="panel"><div className="panel-heading"><h2>Suppliers</h2>{manager && <button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'supplier' })}>Register supplier</button>}</div><div className="supplier-grid">{data.suppliers.map(s => <article className="supplier-card" key={s.id}>
        <h3>{s.name}</h3><p>{s.contactPerson || 'No contact person'}</p><p>{s.email || 'No email'} · {s.phone || 'No phone'}</p><p>{s.address || 'No address'}</p>
        <div className="contact-actions">{s.phone && <a className="button subtle" href={`tel:${s.phone.replace(/\s/g, '')}`}>Call supplier</a>}{s.email && <a className="button subtle" href={`mailto:${s.email}`}>Email supplier</a>}{manager && <button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'supplier', id: s.id })}>Edit contact details</button>}</div>
        <p className="form-hint">Supplies: {s.offers.map(o => item(o.itemId)?.name || 'Unknown item').join(', ') || 'No linked items'}. Edit offers from Inventory.</p>
      </article>)}</div></section>}
      {page === 'recommendations' && <section className="panel"><div className="panel-heading"><h2>Manager review</h2></div>{!manager && <p className="empty">Connect a manager token to load recommendations.</p>}<div className="recommendation-list">{data.recommendations.map(r => <article className="recommendation" key={r.id}>
        <span className="recommendation-id">{r.status} · {r.model}</span><h3>{item(r.itemId)?.name || 'Inventory item'}</h3><p>{r.quantity} {r.unitOfMeasurement} from {supplier(r.supplierId)?.name || 'Supplier'}</p><p>{money(r.estimatedCost)} · {r.leadTimeDays} days estimated delivery</p><div className="reason"><p>{r.reason}</p></div>
        {r.demand && <details className="demand-details"><summary>Demand calculation</summary><p>Weekly usage: {r.demand.averageWeeklyUsage} · 30-day usage: {r.demand.monthlyUsage}</p><p>Safety stock: {r.demand.safetyStock} · Incoming: {r.demand.incomingQuantity}</p><p>Target: {r.demand.targetStock} · Reorder point: {r.demand.reorderPoint}</p>{r.demand.shortageRisk && <p className="demand-warning">Current stock may run out before estimated delivery.</p>}</details>}
        {r.status === 'Pending' && <div className="review-actions"><button className="button subtle" disabled={!canWrite} onClick={() => setModal({ type: 'decision', record: r, approve: false })}>Reject</button><button className="button primary" disabled={!canWrite} onClick={() => setModal({ type: 'decision', record: r, approve: true })}>Review & approve</button></div>}
        {r.note && <p>{r.note}</p>}
      </article>)}</div>{manager && !data.recommendations.length && <p className="empty">No saved recommendations. Open Ask Agent to request one.</p>}</section>}
      {page === 'purchases' && <section className="panel"><div className="panel-heading"><h2>Purchase requests</h2></div>{!manager ? <p className="empty">Connect a manager token to load purchases.</p> : <div className="table-scroll"><table><thead><tr><th>Item</th><th>Supplier</th><th>Quantity</th><th>Status</th></tr></thead><tbody>{data.purchases.map(p => <tr key={p.id}><td>{item(p.itemId)?.name || p.itemId}</td><td>{supplier(p.supplierId)?.name || p.supplierId}</td><td>{p.quantity}</td><td>{p.status}</td></tr>)}</tbody></table></div>}<p className="form-hint live-search">Approval does not send an order or receive goods. Delivery tracking is not connected.</p></section>}
      <section className="panel live-agent-panel" hidden={page !== 'agent'}><h2>Ask Inventory Agent</h2><AskAgent data={data} api={api} enabled={manager && !stale} onSaved={refresh} onBusy={setBusy} /></section>
    </>}
    {modal && <LiveDialog title={modal.type === 'decision' ? `${modal.approve ? 'Approve' : 'Reject'} recommendation?` : modal.type.replaceAll('-', ' ')} busy={busy} onClose={() => setModal(null)}>
      {['edit-item', 'add-item'].includes(modal.type) && <InventoryItemForm data={editData} itemId={modal.id || newItem.id} onCancel={() => setModal(null)} onSubmitValues={values => mutate(() => api.saveItem(modal.id, values), 'Item saved to the database.')} />}
      {modal.type === 'supplier' && <SupplierForm data={data} supplierId={modal.id} onCancel={() => setModal(null)} onSubmitValues={values => mutate(() => api.saveSupplier(modal.id, values), 'Supplier saved to the database.')} />}
      {modal.type === 'offers' && <SupplierOffers data={data} itemId={modal.id} onRegister={() => setModal({ type: 'supplier' })} onSubmitValues={(supplierId, values, editing) => mutate(() => api.saveOffer(supplierId, modal.id, values, editing), 'Supplier offer saved.')} />}
      {modal.type === 'movement' && <form onSubmit={event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); mutate(() => api.recordMovement(modal.id, values), 'Stock movement saved.', true).catch(() => {}) }}>
        <p>{item(modal.id)?.name} · Current stock: {item(modal.id)?.currentStock}</p><label>Movement<select name="type">{permissions.canReceive && <option value="Receive">Receive stock</option>}<option value="Use">Use stock</option></select></label><label>Quantity<DecimalInput name="quantity" min="0.01" max="99999999.99" required /></label><label>Notes<textarea name="notes" maxLength={500} /></label><button className="button primary">Save movement</button>
      </form>}
      {modal.type === 'history' && <div className="history">{data.movements.filter(m => m.itemId === modal.id).map(m => <article key={m.id}><strong>{m.type}: {m.quantity}</strong><small>{new Date(m.createdAt).toLocaleString()}</small><p>{m.notes}</p></article>)}{!data.movements.some(m => m.itemId === modal.id) && <p>No movements recorded.</p>}</div>}
      {modal.type === 'decision' && <form onSubmit={event => { event.preventDefault(); const note = String(new FormData(event.currentTarget).get('note') || ''); mutate(() => api.decide(modal.record.id, modal.approve, note), modal.approve ? 'Approved. One purchase request was created; stock is unchanged.' : 'Recommendation rejected.').catch(() => {}) }}>
        <p>{modal.record.quantity} {modal.record.unitOfMeasurement} · {money(modal.record.estimatedCost)}</p><p className="form-hint">{modal.approve ? 'This creates a real purchase request in the database. It does not send an order or change stock.' : 'This closes the recommendation without a purchase request.'}</p><label>Decision note<textarea name="note" maxLength={500} /></label><button className="button primary">{modal.approve ? 'Approve recommendation' : 'Reject recommendation'}</button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </LiveDialog>}
  </main>
}
