import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function BatchQrLabel({ api, batchId, canManage = false }) {
  const [batch, setBatch] = useState(null)
  const [image, setImage] = useState('')
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true); setError('')
    try {
      const next = await api.batch(batchId)
      const qr = await QRCode.toDataURL(next.qrPayload, { width: 320, margin: 4, errorCorrectionLevel: 'M' })
      setBatch(next); setImage(qr)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { let active = true; setLoading(true)
    Promise.all([api.batch(batchId), QRCode.toDataURL(`agriops:batch:${batchId}`, { width: 320, margin: 4, errorCorrectionLevel: 'M' })])
      .then(([next, qr]) => { if (active) { setBatch(next); setImage(qr) } })
      .catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api, batchId])
  async function saveDetails(event) {
    event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget))
    setLoading(true); setError('')
    try { setBatch(await api.updateBatch(batchId, values)); setEditing(false) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  function print() {
    const popup = window.open('', '_blank', 'width=700,height=700')
    if (!popup) { setError('Allow popups to print this label.'); return }
    popup.document.write(`<!doctype html><html><head><title>AgriOps batch label</title><style>body{font-family:Arial;text-align:center;padding:24px;color:#111}img{width:280px;height:280px}p{margin:8px}small{display:block;overflow-wrap:anywhere}@page{margin:12mm}</style></head><body><h2>${escapeHtml(batch.itemName)}</h2><p>${escapeHtml(batch.supplierName || 'Supplier not recorded')}</p><p>Batch: ${escapeHtml(batch.batchNumber || batch.id)}</p><p>Shelf: ${escapeHtml(batch.shelfLocation || 'Not recorded')}</p><p>Expiration: ${escapeHtml(batch.expirationDate || 'Not recorded — verify before use')}</p><img src="${image}" alt="AgriOps batch QR"><p>Scan in AgriOps to check the live remaining quantity.</p><small>${escapeHtml(batch.qrPayload)}</small></body></html>`)
    popup.document.close()
    const qrImage = popup.document.querySelector('img')
    const startPrint = () => { popup.focus(); popup.print() }
    if (qrImage.complete) startPrint(); else qrImage.onload = startPrint
  }
  return <div className="batch-label">
    {loading && <p role="status">Loading current batch details…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {batch && <><h3>{batch.itemName}</h3><p>{batch.supplierName || 'Supplier not recorded'}</p>
      <p><strong>{batch.remainingQuantity == null ? 'Quantity not tracked' : `${batch.remainingQuantity} ${batch.unitOfMeasurement} remaining in this batch`}</strong></p>
      <p>Status: {batch.status} · Total item stock: {batch.totalItemStock} {batch.unitOfMeasurement}</p>
      <p>Batch: {batch.batchNumber || 'Not recorded'} · Shelf: {batch.shelfLocation || 'Not recorded'}</p>
      <p>Expiration date: <strong>{batch.expirationDate || 'Not recorded — verify before use'}</strong></p>
      {batch.status === 'Awaiting receipt' && <p className="form-hint">This label is ready to print. Confirm the actual batch details when goods arrive. It has no available stock yet.</p>}
      {batch.isLegacy && <p className="form-hint">Existing stock: its original batch and expiration date were not recorded.</p>}
      <img src={image} width="280" height="280" alt={`Batch QR label for ${batch.itemName}`} />
      <p className="form-hint">Scan using the AgriOps mobile scanner. The label stays the same as its remaining quantity changes.</p>
      {canManage && batch.receivedAt && !editing && <button className="button subtle" disabled={loading} onClick={() => setEditing(true)}>Edit batch details</button>}
      {editing && <form onSubmit={saveDetails}><label>Actual expiration date<input type="date" name="expirationDate" max="9999-12-31" defaultValue={batch.expirationDate || ''} /></label><label>Batch / lot number<input name="batchNumber" maxLength={100} defaultValue={batch.batchNumber || ''} /></label><label>Shelf location<input name="shelfLocation" maxLength={100} defaultValue={batch.shelfLocation || ''} /></label><p className="form-hint">Changes appear when the same QR is scanned. Reprint if the text on the shelf label changes. Stock quantities stay unchanged.</p><div className="modal-actions"><button type="button" className="button subtle" disabled={loading} onClick={() => setEditing(false)}>Cancel</button><button className="button primary" disabled={loading}>Save batch details</button></div></form>}
      <div className="modal-actions"><button className="button subtle" disabled={loading} onClick={load}>Refresh quantity</button><button className="button primary" disabled={loading || !image} onClick={print}>Print QR label</button></div>
    </>}
  </div>
}

export default function InventoryBatchPanel({ api, itemId, canManage = false }) {
  const [batches, setBatches] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { let active = true
    api.batches(itemId).then(next => { if (active) setBatches(next) }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [api, itemId])
  if (selected) return <><button className="button subtle" onClick={() => setSelected(null)}>Back to batches</button><BatchQrLabel api={api} batchId={selected} canManage={canManage} /></>
  return <div>
    <p className="form-hint">FIFO: scan and issue the oldest received available batch first. Check its expiration date; expired batches cannot be issued.</p>
    {loading && <p role="status">Loading batches…</p>}{error && <p className="form-error" role="alert">{error}</p>}
    {!loading && !batches.length && <p>No tracked batches yet. New receipts create them; existing stock is tracked when its next movement is recorded.</p>}
    <div className="table-scroll"><table><thead><tr><th>Batch / shelf</th><th>Expiration</th><th>Remaining</th><th>Status</th><th>Label</th></tr></thead><tbody>{batches.map(b => <tr key={b.id}>
      <td>{b.batchNumber || 'Not recorded'}<small>{b.shelfLocation || ''}</small></td><td>{b.expirationDate || 'Not recorded'}</td><td>{b.remainingQuantity} {b.unitOfMeasurement}</td><td>{b.status}{b.isNextToIssue ? ' · Issue first' : ''}</td><td><button className="button subtle" onClick={() => setSelected(b.id)}>Show QR label</button></td>
    </tr>)}</tbody></table></div>
  </div>
}
