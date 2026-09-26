import { useEffect, useRef, useState } from 'react'
import { initialData, lowStock, money, decideRecommendation, recordMovement } from './demo'
import './App.css'
import { SupplierForm, SupplierOffers } from './SupplierForms'

function Icon({ name, size = 20 }) {
  const paths = {
    leaf: 'M20 4c-9-2-17 2-15 10s15 7 15-10ZM5 20 16 9',
    box: 'm3 7 9-5 9 5-9 5-9-5Zm0 0v10l9 5 9-5V7M12 12v10M7 4.8l10 5.5',
    people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9M15 3a4 4 0 0 1 0 8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    spark: 'm12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4L12 3Z',
    list: 'M8 3h8v4H8zM8 5H5v16h14V5h-3M8 12h8M8 16h5',
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-5-5 5 5-5 5',
    alert: 'm12 3 10 18H2L12 3Zm0 6v5m0 3v1',
    check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
    clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    swap: 'M4 7h15l-4-4M20 17H5l4 4',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Zm18 2-10 7L2 6',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.box} /></svg>
}
function Modal({ title, subtitle, children, onClose }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} onCancel={onClose} aria-labelledby="modal-title" onClick={e => { if (e.target === ref.current) onClose() }}><div className="modal-head"><div><span className="eyebrow">DEMO WORKSPACE</span><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close" /></button></div>{children}</dialog>
}
const pages = [
  { id: 'inventory', label: 'Inventory', icon: 'box', description: 'A clear view of the resources that keep your farm growing.' },
  { id: 'suppliers', label: 'Suppliers', icon: 'people', description: 'Compare available resources, prices and delivery estimates.' },
  { id: 'recommendations', label: 'Recommendations', icon: 'spark', description: 'Review the evidence. Make the final decision.' },
  { id: 'purchases', label: 'Purchase requests', icon: 'list', description: 'Requests created from manager-approved recommendations.' },
]
function currentPage() { return pages.some(p => p.id === location.hash.slice(1)) ? location.hash.slice(1) : 'inventory' }
const date = value => new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
const badge = status => <span className={`badge ${status.toLowerCase()}`}>{status}</span>

export default function App() {
  const [data, setData] = useState(initialData)
  const [page, setPage] = useState(currentPage)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const update = () => { setPage(currentPage()); setSearch(''); setFilter('all') }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = id => { location.hash = id; setPage(id); setSearch(''); setFilter('all') }
  const open = value => { setError(''); setModal(value) }
  const close = () => { setModal(null); setError('') }
  const item = id => data.items.find(i => i.id === id)
  const supplier = id => data.suppliers.find(s => s.id === id)
  const pending = data.recommendations.filter(r => r.status === 'Pending')
  const low = data.items.filter(lowStock)
  const visible = data.items.filter(i => `${i.name} ${i.category}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (filter === 'low' ? lowStock(i) : !lowStock(i))))
  const active = pages.find(p => p.id === page)
  function submitItem(event) {
    event.preventDefault()
    const v = Object.fromEntries(new FormData(event.currentTarget))
    if (!v.name.trim()) { setError('Enter a resource name.'); return }
    const newId = crypto.randomUUID()
    setData({ ...data, items: [...data.items, { id: newId, name: v.name.trim(), category: v.category, unitOfMeasurement: v.unit, currentStock: 0, minimumStockLevel: Number(v.minimum), unitCost: Number(v.cost) }] })
    if (v.linkSuppliers) open({ type: 'offers', itemId: newId }); else close()
    setNotice('Demo item added with zero stock. Supplier prices are managed in Supplier offers.')
  }
  function submitMovement(event) {
    event.preventDefault()
    const v = Object.fromEntries(new FormData(event.currentTarget))
    try { setData(recordMovement(data, modal.itemId, v.type, v.quantity, v.notes, crypto.randomUUID())); close(); setNotice('Demo movement recorded. Purchase fulfilment is not linked yet.') }
    catch (err) { setError(err.message) }
  }
  function submitDecision(event) {
    event.preventDefault()
    try { setData(decideRecommendation(data, modal.record.id, modal.approve, new FormData(event.currentTarget).get('note'))); close(); setNotice(modal.approve ? 'Demo recommendation approved. One purchase request created; stock is unchanged.' : 'Demo recommendation rejected. No purchase request created.') }
    catch (err) { setError(err.message) }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById("main").focus() }}>Skip to content</a>
    <aside className="sidebar">
      <a className="brand" href="#inventory"><span className="brand-symbol"><Icon name="leaf" size={25} /></span><span>AgriOps<span className="brand-ai">AI</span><small>FARM MANAGEMENT</small></span></a>
      <div className="workspace"><span className="farm-avatar">GF</span><div>Greenfield Farm<small>Sample farm workspace</small></div><span className="workspace-dot" /></div>
      <p className="nav-label">RESOURCE MANAGEMENT</p>
      <nav aria-label="Main navigation">{pages.map(p => <a href={`#${p.id}`} key={p.id} aria-current={p.id === page ? 'page' : undefined} className={p.id === page ? 'active' : ''}><Icon name={p.icon} /><span>{p.label}</span>{p.id === 'recommendations' && pending.length > 0 && <b className="nav-count">{pending.length}</b>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="demo-card"><span className="demo-dot" /> Preview workspace<p>Explore the manager workflow with sample records.</p><button onClick={() => open({ type: 'reset' })}>Reset demo <Icon name="swap" size={15} /></button></div><div className="profile"><span className="profile-avatar">DM</span><div>Demo manager<small>Authentication pending</small></div></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div>Workspace <span>/</span> <strong>{active.label}</strong></div><span className="environment"><span /> Browser demo</span></header>
      <main id="main" tabIndex={-1}>
        <div className="demo-banner"><Icon name="alert" size={17} /><span><strong>Demo mode.</strong> Sample data only. Changes stay in this tab and reset on refresh. No backend or AI calls.</span></div>
        <div className="page-heading"><div><p className="eyebrow">YOUR FARM, WELL SUPPLIED</p><h1>{active.label}</h1><p>{active.description}</p></div>{page === 'inventory' && <button className="button primary" onClick={() => open({ type: 'item' })}><Icon name="plus" size={18} /> Add item</button>}{page === 'suppliers' && <button className="button primary" onClick={() => open({ type: 'supplier' })}><Icon name="plus" size={18} /> Register supplier</button>}</div>
        {notice && <div className="notice" role="status"><Icon name="check" size={18} /><span>{notice}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setNotice('')}><Icon name="close" size={16} /></button></div>}
        <section className="stats" aria-label="Inventory overview">{[
          { label: 'Inventory items', value: data.items.length, detail: 'Resources in your catalogue', icon: 'box', color: 'green' },
          { label: 'Need attention', value: low.length, detail: 'Below minimum stock', icon: 'alert', color: 'orange' },
          { label: 'Awaiting review', value: pending.length, detail: 'Sample recommendations', icon: 'spark', color: 'purple' },
          { label: 'Purchase requests', value: data.purchases.length, detail: 'Manager-approved requests', icon: 'list', color: 'blue' },
        ].map(s => <article className="stat" key={s.label}><div><span>{s.label}</span><strong>{s.value.toString().padStart(2, '0')}</strong><small>{s.detail}</small></div><span className={`stat-icon ${s.color}`}><Icon name={s.icon} size={22} /></span></article>)}</section>
        {page === 'inventory' && <>
          <section className="review-callout"><span className="callout-icon"><Icon name="spark" size={24} /></span><div><h2>A little planning keeps your farm moving.</h2><p>{pending.length} sample recommendations ready for review. You decide what gets ordered.</p></div><button className="button light" onClick={() => navigate('recommendations')}>Review recommendations <Icon name="arrow" size={17} /></button></section>
          <section className="panel"><div className="panel-heading"><div><h2>Resource inventory <span className="count">{data.items.length}</span></h2><p>Monitor stock and record resource movements.</p></div><span className="muted small">Sample values in LKR</span></div>
            <div className="toolbar"><div className="tabs" aria-label="Stock filters">{[['all', 'All items'], ['low', 'Low stock'], ['healthy', 'Healthy stock']].map(([id, label]) => <button key={id} aria-pressed={filter === id} className={filter === id ? 'selected' : ''} onClick={() => setFilter(id)}>{label}{id === 'low' && <span>{low.length}</span>}</button>)}</div><label className="search"><Icon name="search" size={17} /><input aria-label="Search inventory" placeholder="Search resources…" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
            <div className="table-scroll"><table><thead><tr><th>Resource</th><th>Category</th><th>Stock level</th><th>Status</th><th>Valuation / unit</th><th aria-label="Actions"></th></tr></thead><tbody>{visible.map(i => <tr key={i.id}><td><div className="resource"><span className={`resource-icon ${lowStock(i) ? 'warm' : ''}`}><Icon name={i.category === 'Equipment' ? 'box' : 'leaf'} /></span><button className="text-button" onClick={() => open({ type: 'history', itemId: i.id })}>{i.name}<small>View movement history</small></button></div></td><td className="muted">{i.category}</td><td><div className="stock-number">{i.currentStock} <span>{i.unitOfMeasurement}</span><small>Min. {i.minimumStockLevel}</small></div><div className="stock-bar"><span className={lowStock(i) ? 'low' : ''} style={{ width: `${Math.min(100, i.currentStock / Math.max(1, i.minimumStockLevel * 2) * 100)}%` }} /></div></td><td><span className={`badge ${lowStock(i) ? 'low-stock' : 'healthy'}`}><span className="badge-dot" />{i.currentStock === 0 ? 'Out of stock' : lowStock(i) ? 'Low stock' : 'Healthy'}</span></td><td>{money(i.unitCost)}</td><td><div className="item-actions"><button className="button subtle compact" onClick={() => open({ type: 'offers', itemId: i.id })}>Supplier offers ({data.suppliers.filter(s => s.offers.some(o => o.itemId === i.id)).length})</button><button className="button subtle compact" onClick={() => open({ type: 'movement', itemId: i.id })}><Icon name="swap" size={16} /> Record movement</button></div></td></tr>)}</tbody></table></div>
            {!visible.length && <div className="empty"><Icon name="search" size={30} /><h3>No resources found</h3><p>Try a different search or stock filter.</p><button className="button subtle" onClick={() => { setSearch(''); setFilter('all') }}>Clear filters</button></div>}
            <div className="table-footer">Showing {visible.length} of {data.items.length} resources <span>Stock changes only when a movement is recorded.</span></div>
          </section>
        </>}
        {page === 'suppliers' && <section className="panel"><div className="panel-heading"><div><h2>Your supplier network</h2><p>Contact registered suppliers directly from their profile. Delivery days are estimates.</p></div><label className="search"><Icon name="search" size={17} /><input aria-label="Search suppliers" placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} /></label></div><div className="supplier-grid">{data.suppliers.filter(s => `${s.name} ${s.contactPerson} ${s.email} ${s.address}`.toLowerCase().includes(search.toLowerCase())).map(s => <article className="supplier-card" key={s.id}><div className="supplier-title"><span className="supplier-avatar">{s.initials}</span><div><h3>{s.name}</h3><p>Contact person: {s.contactPerson || 'Not provided'}</p></div></div><div className="contact-details"><div><span className="contact-label">Email</span><a href={s.email ? `mailto:${s.email}` : undefined} className={s.email ? 'contact-value contact-link' : 'contact-value'}>{s.email || 'Not provided'}</a></div><div><span className="contact-label">Phone</span><a href={s.phone ? `tel:${s.phone.replace(/\s/g, '')}` : undefined} className={s.phone ? 'contact-value contact-link' : 'contact-value'}>{s.phone || 'Not provided'}</a></div><div><span className="contact-label">Address</span><span className="contact-value">{s.address || 'Not provided'}</span></div></div><div className="contact-actions">{s.phone && <a className="button subtle compact" href={`tel:${s.phone.replace(/\s/g, '')}`}><Icon name="phone" size={15} /> Call supplier</a>}{s.email && <a className="button subtle compact" href={`mailto:${s.email}`}><Icon name="mail" size={15} /> Email supplier</a>}</div>{!s.offers.length && <p className="form-hint">No items linked yet. Open an inventory item’s Supplier offers to add a price.</p>}<div className="offer-list">{s.offers.map(o => <div key={o.itemId}><div><button className="text-button" onClick={() => open({ type: 'offers', itemId: o.itemId })}>{item(o.itemId).name}</button><small>{o.isAvailable ? `${o.leadTimeDays} days estimated delivery` : 'Currently unavailable'}</small></div><span>{money(o.unitPrice)}<small>/ {item(o.itemId).unitOfMeasurement}</small></span></div>)}</div></article>)}</div>{!data.suppliers.some(s => `${s.name} ${s.contactPerson} ${s.email} ${s.address}`.toLowerCase().includes(search.toLowerCase())) && <div className="empty"><h3>No suppliers found</h3><p>Try a different name, person or address.</p></div>}</section>}
        {page === 'recommendations' && <section className="panel"><div className="panel-heading"><div><h2>Manager review queue</h2><p>These proposals are sample fixtures, not live AI output.</p></div><label className="select-label">Status<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All decisions</option><option>Pending</option><option>Approved</option><option>Rejected</option></select></label></div><div className="recommendation-list">{data.recommendations.filter(r => filter === 'all' || r.status === filter).map(r => <article className="recommendation" key={r.id}><div className="recommendation-top"><span className="recommendation-id"><Icon name="spark" size={16} />{r.id} · SAMPLE PROPOSAL</span>{badge(r.status)}</div><h3>{item(r.itemId).name}</h3><p className="recommendation-subtitle">{r.quantity} {item(r.itemId).unitOfMeasurement} from {supplier(r.supplierId).name}</p><div className="evidence-grid"><div><span>Stock at proposal</span><strong>{r.stockAtProposal} / {r.minimumAtProposal} <small>minimum</small></strong></div><div><span>Estimated cost</span><strong>{money(r.quantity * r.unitPrice)}</strong></div><div><span>Estimated delivery</span><strong>{r.leadTimeDays} days</strong></div></div><div className="reason"><strong>Why this supplier?</strong><p>{r.reason}</p></div>{r.status === 'Pending' ? <div className="review-actions"><p><Icon name="clock" size={16} /> Manager decision required</p><button className="button subtle" onClick={() => open({ type: 'decision', record: r, approve: false })}>Reject</button><button className="button primary" onClick={() => open({ type: 'decision', record: r, approve: true })}><Icon name="check" size={16} /> Review & approve</button></div> : <div className="decision-note"><strong>{r.status} in this demo</strong><p>{r.note || 'No decision note provided.'}</p>{r.purchaseId && <button className="text-link" onClick={() => navigate('purchases')}>View purchase requests →</button>}</div>}</article>)}</div>{!data.recommendations.some(r => filter === 'all' || r.status === filter) && <div className="empty"><Icon name="check" size={32} /><h3>No {filter.toLowerCase()} recommendations</h3><p>Change the status filter to see other decisions.</p></div>}</section>}
        {page === 'purchases' && <section className="panel"><div className="panel-heading"><div><h2>Approved purchase requests</h2><p>Approval creates a request. It does not send an order or receive goods.</p></div></div><div className="table-scroll"><table><thead><tr><th>Request</th><th>Resource</th><th>Supplier</th><th>Quantity</th><th>Status</th><th>Source</th></tr></thead><tbody>{data.purchases.map(p => <tr key={p.id}><td><strong>{p.id}</strong><small className="cell-small">{date(p.createdAt)}</small></td><td>{item(p.itemId).name}</td><td>{supplier(p.supplierId).name}</td><td>{p.quantity} {item(p.itemId).unitOfMeasurement}</td><td>{badge(p.status)}</td><td>{p.recommendationId || 'Seeded demo request'}</td></tr>)}</tbody></table></div><div className="table-footer">{data.purchases.length} demo requests <span>Order dispatch and delivery tracking will be added later.</span></div></section>}
        <footer className="page-footer"><span><Icon name="leaf" size={15} /> AgriOpsAI · Inventory & agricultural resources</span><span>Designed for decisions that keep things growing.</span></footer>
      </main>
    </div>
    {modal?.type === 'supplier' && <Modal title="Register a supplier" subtitle="Add contact details before linking this supplier to inventory items." onClose={close}><SupplierForm data={data} onCancel={close} onSave={next => { setData(next); setNotice('Demo supplier registered. You can now add their item prices.'); if (modal.returnItemId) open({ type: 'offers', itemId: modal.returnItemId }); else close() }} /></Modal>}
    {modal?.type === 'offers' && <Modal title={`Supplier offers · ${item(modal.itemId).name}`} subtitle="Manage the suppliers and prices for this inventory item." onClose={close}><SupplierOffers key={modal.itemId} data={data} itemId={modal.itemId} onSave={next => { setData(next); setNotice('Demo supplier offer saved. Item valuation and stock are unchanged.') }} onRegister={() => open({ type: 'supplier', returnItemId: modal.itemId })} /></Modal>}
    {modal?.type === 'item' && <Modal title="Add an inventory item" subtitle="New items start at zero stock." onClose={close}><form onSubmit={submitItem}><label>Resource name<input name="name" required maxLength={100} placeholder="e.g. Organic fertilizer" /></label><div className="form-row"><label>Category<select name="category">{['Fertilizer', 'Seeds', 'Crop protection', 'Equipment', 'Feed', 'Other'].map(c => <option key={c}>{c}</option>)}</select></label><label>Unit<select name="unit">{['kg', 'litres', 'units'].map(u => <option key={u}>{u}</option>)}</select></label></div><div className="form-row"><label>Minimum stock<input name="minimum" type="number" min="0" max="99999999.99" step="0.01" required /></label><label>Valuation cost per unit (LKR)<input name="cost" type="number" min="0" max="99999999.99" step="0.01" defaultValue="0" required /></label></div><p className="form-hint">Valuation cost is a reference for inventory value, not a supplier quote. Each supplier’s price is recorded separately in Supplier offers.</p><label className="checkbox-label"><input name="linkSuppliers" type="checkbox" defaultChecked /> Link registered suppliers after saving</label><p className="form-hint">Optional: add one or more supplier offers next, or do it later from the inventory list.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button subtle" onClick={close}>Cancel</button><button className="button primary">Add demo item</button></div></form></Modal>}
    {modal?.type === 'movement' && <Modal title="Record stock movement" subtitle={`${item(modal.itemId).name} · Current stock: ${item(modal.itemId).currentStock} ${item(modal.itemId).unitOfMeasurement}`} onClose={close}><form onSubmit={submitMovement}><div className="form-row"><label>Movement<select name="type"><option value="Receive">Receive stock</option><option value="Use">Use stock</option></select></label><label>Quantity ({item(modal.itemId).unitOfMeasurement})<input name="quantity" type="number" min="0.01" max="99999999.99" step="0.01" required /></label></div><label>Notes<textarea name="notes" maxLength={500} rows={3} placeholder="What was received or used?" /></label><p className="form-hint">This updates demo stock only. It is not linked to a purchase receipt.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button subtle" onClick={close}>Cancel</button><button className="button primary">Save demo movement</button></div></form></Modal>}
    {modal?.type === 'history' && <Modal title={item(modal.itemId).name} subtitle="Movements recorded during this demo session." onClose={close}><div className="history">{data.movements.filter(m => m.itemId === modal.itemId).map(m => <article key={m.id}><div><strong>{m.type === 'Receive' ? '+' : '−'}{m.quantity} {item(m.itemId).unitOfMeasurement} · {m.type}</strong><small>{date(m.createdAt)}</small></div><p>{m.notes || 'No notes'}</p></article>)}{!data.movements.some(m => m.itemId === modal.itemId) && <div className="empty"><Icon name="clock" size={28} /><h3>No recorded movements yet</h3><p>Opening balances are synthetic sample data.</p></div>}</div><div className="modal-actions"><button className="button primary" onClick={() => open({ type: 'movement', itemId: modal.itemId })}>Record movement</button></div></Modal>}
    {modal?.type === 'decision' && <Modal title={modal.approve ? 'Approve this recommendation?' : 'Reject this recommendation?'} subtitle={`${modal.record.id} · ${item(modal.record.itemId).name}`} onClose={close}><form onSubmit={submitDecision}><div className="decision-summary"><strong>{modal.record.quantity} {item(modal.record.itemId).unitOfMeasurement} · {supplier(modal.record.supplierId).name}</strong><p>{money(modal.record.quantity * modal.record.unitPrice)} · {modal.record.leadTimeDays}-day estimated delivery</p></div><p className="form-hint">{modal.approve ? 'Approval creates one demo purchase request. It does not change stock or contact the supplier.' : 'Rejection closes this demo recommendation without creating a purchase request.'}</p><label>Decision note (optional)<textarea name="note" rows={3} maxLength={500} placeholder="Record the reason for your decision…" /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button subtle" onClick={close}>Cancel</button><button className={`button ${modal.approve ? 'primary' : 'danger'}`}>{modal.approve ? 'Approve demo recommendation' : 'Reject demo recommendation'}</button></div></form></Modal>}
    {modal?.type === 'reset' && <Modal title="Reset the demo?" subtitle="This clears changes in this tab and restores the sample records." onClose={close}><div className="modal-actions"><button className="button subtle" onClick={close}>Cancel</button><button className="button primary" onClick={() => { setData(initialData()); close(); setNotice('Demo restored to its initial sample records.') }}>Reset demo</button></div></Modal>}
  </div>
}
