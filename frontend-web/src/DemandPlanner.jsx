import { useState } from 'react'
import DecimalInput from './DecimalInput'
import { calculateDemand, demandEvidence, proposeDemand } from './demand'
import { money } from './demo'

export default function DemandPlanner({ data, itemId, onSave }) {
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')
  const item = data.items.find(i => i.id === itemId)
  const evidence = demandEvidence(data, itemId)
  const usesHistory = evidence.historyComplete && evidence.usage > 0
  const pending = data.recommendations.some(r => r.itemId === itemId && r.status === 'Pending')
  const amount = value => Number(value).toLocaleString('en-GB', { maximumFractionDigits: 2 })
  let plan
  if (settings) {
    try { plan = calculateDemand(data, itemId, settings) } catch { /* Show validation on submission. */ }
  }
  function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try { calculateDemand(data, itemId, values); setSettings(values); setError('') }
    catch (err) { setSettings(null); setError(err.message) }
  }
  function propose(supplierId) {
    try { onSave(proposeDemand(data, itemId, supplierId, settings, `REC-${crypto.randomUUID()}`)) }
    catch (err) { setError(err.message) }
  }
  return <div className="demand-planner">
    <form onSubmit={submit} onChange={() => setSettings(null)}>
      {usesHistory ? <p className="demand-intro">We’ll use your recorded usage from the last 4 weeks.</p> : <>
        <p className="demand-intro">There isn’t enough usage history yet. Enter how much you expect to use each week.</p>
        <label>Weekly usage ({item.unitOfMeasurement})<DecimalInput name="weeklyEstimate" min="0.01" max="99999999.99" placeholder="e.g. 40" aria-describedby="weekly-usage-help" required /></label>
        <p id="weekly-usage-help" className="form-hint">This is your expected use, not the amount to order.</p>
      </>}
      <details className="demand-details demand-settings">
        <summary>Extra stock buffer · 7 days by default</summary>
        <label>Extra days to cover<input name="safetyDays" type="number" min="0" max="90" step="1" defaultValue="7" required aria-describedby="buffer-help" /></label>
        <p id="buffer-help" className="form-hint">Keep extra stock in case usage increases or a delivery is late.</p>
      </details>
      <button className="button primary">Calculate order amount</button>
    </form>
    {error && <p className="form-error" role="alert">{error}</p>}
    {plan && <section aria-label="Demand calculation">
      <h3 className="demand-heading">Your order options</h3>
      {pending && <p className="demand-note">This item already has a recommendation waiting for review. Open Recommendations to approve or reject it first.</p>}
      {!plan.offers.length && <p className="demand-note">No suppliers available. Add an available offer in Inventory → Supplier offers.</p>}
      <div className="item-offers">{plan.offers.map(o => <article key={o.supplierId}>
        <h4>{o.supplierName}</h4>
        <p className="demand-supplier-meta">Estimated delivery: {o.leadTimeDays} days · {money(o.unitPrice)} / {item.unitOfMeasurement}</p>
        <p className="demand-amount">{!o.withinLimit ? 'Check your weekly estimate' : o.due ? <>Order <strong>{amount(o.quantity)} {item.unitOfMeasurement}</strong></> : 'No order needed now'}</p>
        {o.due && o.withinLimit && <p className="demand-supplier-meta">Estimated total: {money(o.quantity * o.unitPrice)}</p>}
        {o.shortageRisk && <p className="demand-warning">Stock may run out before delivery. Contact the supplier to confirm timing.</p>}
        {!o.withinLimit && <p className="form-hint">The calculated amount exceeds the system limit.</p>}
        <details className="demand-details">
          <summary>How we calculated this</summary>
          <p className="form-hint">Based on {plan.source === 'Manager weekly estimate' ? 'your weekly estimate' : 'recorded usage over 4 weeks'}. Figures are in {item.unitOfMeasurement}.</p>
          <dl>
            <div><dt>Average use per week</dt><dd>{amount(plan.averageWeekly)}</dd></div>
            <div><dt>Expected use in 30 days</dt><dd>{amount(plan.monthlyUsage)}</dd></div>
            <div><dt>Extra stock ({plan.safetyDays} days)</dt><dd>{amount(plan.safetyStock)}</dd></div>
            <div><dt>Desired stock level</dt><dd>{amount(o.targetStock)}</dd></div>
            <div><dt>Already in stock</dt><dd>{amount(item.currentStock)}</dd></div>
            <div><dt>Already on order</dt><dd>{amount(plan.incoming)}</dd></div>
            <div><dt>Order when stock reaches</dt><dd>{amount(o.reorderPoint)}</dd></div>
          </dl>
          <p className="form-hint">Order amount = desired stock − current stock − incoming orders, with a minimum of zero. We cover at least 30 days, or a longer delivery time, plus the buffer. Your minimum stock setting is also respected. Incoming delivery dates are unconfirmed.</p>
        </details>
        {o.due && o.withinLimit && <button className="button primary" disabled={pending} onClick={() => propose(o.supplierId)}>Create demo recommendation</button>}
      </article>)}</div>
      {plan.offers.some(o => o.due && o.withinLimit) && !pending && <p className="form-hint">A manager must approve the recommendation before a purchase request is created.</p>}
    </section>}
  </div>
}
