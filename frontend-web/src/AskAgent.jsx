import { useRef, useState } from 'react'
import DecimalInput from './DecimalInput'
import { money } from './demo'

const explanations = {
  weekly_estimate_required: 'There is not enough usage history. Start a new request with your expected weekly usage.',
  pending_recommendation_exists: 'This item already has a pending recommendation. Review it before requesting another.',
  no_available_supplier: 'Add an available supplier offer for this item first.',
  demand_evidence_unavailable: 'The backend needs the demand-planning update before this request can run.',
  demand_exceeds_stock_limit: 'The calculated amount exceeds the stock limit. Review the weekly estimate.',
  too_many_offers_for_review: 'There are more supplier offers than this agent can review in one request.',
}

export default function AskAgent({ data, api, enabled = false, onSaved, initialItemId = '', onBusy = () => {} }) {
  const [itemId, setItemId] = useState(initialItemId || data.items[0]?.id || '')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [request, setRequest] = useState(null)
  const [busy, setBusy] = useState(false)
  const lock = useRef(false)
  const item = data.items.find(i => i.id === itemId)
  const finished = result && ['awaiting_approval', 'approved', 'rejected', 'no_action', 'blocked', 'failed'].includes(result.status) && !result.canRetry
  async function perform(action) {
    if (lock.current) return
    lock.current = true; setBusy(true); onBusy(true); setError('')
    try {
      const next = await action()
      setResult(next)
      if (next.recommendation) await onSaved?.()
    } catch (err) { setError(err.message) }
    finally { lock.current = false; setBusy(false); onBusy(false) }
  }
  function submit(event) {
    event.preventDefault()
    if (!api || !enabled || request) return
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (!values.message.trim()) { setError('Enter a request or supplier preference.'); return }
    const body = { request_id: crypto.randomUUID(), inventory_item_id: itemId, message: values.message.trim(), safety_days: Number(values.safetyDays),
      ...(values.weeklyEstimate ? { weekly_estimate: values.weeklyEstimate } : {}) }
    setRequest(body)
    perform(() => api.recommend(body))
  }
  return <section className="ask-agent" aria-label="Ask Inventory Agent">
    <p className="demand-intro">Plan the next 30 days for one item. Tell the agent what matters when choosing a supplier.</p>
    {!enabled && <p className="demand-note">Connect a valid manager session to send requests to the agent.</p>}
    {request && <div className="demand-note"><p>{busy ? 'Your request is processing. Fields are locked until it finishes.' : 'These fields belong to the submitted request. Start a new request to change weekly usage or the stock buffer.'}</p>{finished && !busy && <button className="button subtle" onClick={() => { setRequest(null); setResult(null); setError('') }}>New request</button>}</div>}
    <form onSubmit={submit}>
      <fieldset disabled={busy || Boolean(request)}>
        <label>Inventory item<select value={itemId} onChange={e => setItemId(e.target.value)} required><option value="" disabled>Select an item</option>{data.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
        <label>Your request<textarea name="message" maxLength={500} rows={3} defaultValue="Recommend a supplier for my next reorder. Compare price and delivery time." required /></label>
        <p className="form-hint">For example: “Prefer faster delivery if the price difference is small.” Quantity and safety settings come from the fields below, not instructions in the message.</p>
        <details className="demand-details" open={!enabled}>
          <summary>Usage estimate and safety stock</summary>
          <label>Weekly usage ({item?.unitOfMeasurement || 'units'}, only if history is missing)<DecimalInput name="weeklyEstimate" min="0.01" max="99999999.99" /></label>
          <label>Extra stock buffer (days)<input name="safetyDays" type="number" defaultValue="7" min="0" max="90" step="1" required /></label>
        </details>
        <button className="button primary" disabled={!enabled || !item}>Generate recommendation</button>
      </fieldset>
    </form>
    {busy && <p role="status" className="demand-note">The agent is processing your request. This may take a minute.</p>}
    {error && <p role="alert" className="form-error">{error}</p>}
    {request && <div className="agent-run">
      <p className="form-hint">Request ID: <code>{request.request_id}</code></p>
      {!finished && !busy && <><p className="form-hint">If the response was interrupted, check this request before starting another. Retrying reuses the same ID.</p><div className="live-actions">
        <button className="button subtle" onClick={() => perform(() => api.run(request.request_id))}>Check request</button>
        <button className="button subtle" onClick={() => perform(() => result?.canRetry ? api.resume(request.request_id) : api.recommend(request))}>{result?.canRetry ? 'Resume request' : 'Retry same request'}</button>
      </div></>}
    </div>}
    {result && <div className="agent-result" aria-live="polite">
      {result.recommendation ? <>
        <h3>Recommendation saved · {result.recommendation.status}</h3>
        <p className="demand-amount"><strong>{result.recommendation.recommendedQuantity} {item?.unitOfMeasurement}</strong></p>
        <p>{data.suppliers.find(s => s.id === result.recommendation.supplierId)?.name || 'Supplier'} · {money(result.recommendation.estimatedCost)}</p>
        <p>{result.recommendation.reason}</p>
        <p className="form-hint">Open Recommendations to review and approve or reject. No order has been sent.</p>
      </> : <><h3>{result.status === 'no_action' ? 'No new order needed' : 'Request needs attention'}</h3><p>{explanations[result.error] || (result.status === 'no_action' ? 'Current stock and incoming orders cover the calculated need. Check delivery-risk details below.' : 'The agent could not finish a valid recommendation. Check configuration or refresh the inventory before a new request.')}</p></>}
      <details className="demand-details"><summary>Request details</summary><p>Status: {result.status}</p>{result.error && <p>Code: {result.error}</p>}{result.demandPlans?.some(p => p.shortageRisk) && <p className="demand-warning">Some supplier delivery estimates exceed current stock coverage. Confirm arrival dates.</p>}<ul>{result.trace?.map((entry, index) => <li key={index}>{entry.step}: {entry.outcome}</li>)}</ul></details>

    </div>}
  </section>
}
