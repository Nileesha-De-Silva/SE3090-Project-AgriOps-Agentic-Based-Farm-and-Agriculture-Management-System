import DecimalInput from './DecimalInput'
import { useState } from 'react'
import { hasInventoryReferences, updateInventoryItem } from './demo'

export default function InventoryItemForm({ data, itemId, onSave, onCancel, onSubmitValues }) {
  const [error, setError] = useState('')
  const item = data.items.find(i => i.id === itemId)
  const units = ['kg', 'g', 'litre', 'packet', 'bag', 'piece']
  const [unitChoice, setUnitChoice] = useState(units.includes(item.unitOfMeasurement) ? item.unitOfMeasurement : 'custom')
  const locked = hasInventoryReferences(data, itemId)
  async function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (locked) values.unitOfMeasurement = item.unitOfMeasurement
    try {
      const next = updateInventoryItem(data, itemId, values)
      if (onSubmitValues) await onSubmitValues(values)
      else onSave(next)
    }
    catch (err) { setError(err.message) }
  }
  return <form onSubmit={submit}>
    <label>Resource name<input name="name" defaultValue={item.name} required maxLength={100} /></label>
    <div className="form-row">
      <label>Category<input name="category" defaultValue={item.category} required maxLength={50} /></label>
      <label>Unit of measurement<select name={unitChoice === 'custom' ? undefined : 'unitOfMeasurement'} value={unitChoice} onChange={event => setUnitChoice(event.target.value)} required disabled={locked}>
        {units.map(unit => <option key={unit} value={unit}>{unit === 'packet' ? 'packet (packets)' : unit}</option>)}
        <option value="custom">Other unit</option>
      </select>
        {unitChoice === 'custom' && <input name="unitOfMeasurement" aria-label="Other unit of measurement" defaultValue={item.unitOfMeasurement} required maxLength={30} disabled={locked} />}
      </label>
    </div>
    {!locked && <p className="form-hint">Choose a unit or enter your own. For seeds sold in packets, use packet and record the number of packets.</p>}
    {locked && <p className="form-hint">The unit is locked because this item has stock, supplier offers or historical records.</p>}
    <div className="form-row">
      <label>Minimum stock<DecimalInput name="minimumStockLevel" type="number" defaultValue={item.minimumStockLevel} min="0" max="99999999.99" step="0.01" required /></label>
      <label>Valuation cost per unit (LKR)<DecimalInput name="unitCost" type="number" defaultValue={item.unitCost} min="0" max="99999999.99" step="0.01" required /></label>
    </div>
    <p className="form-hint">Current stock: {item.currentStock} {item.unitOfMeasurement}. Use Record movement to change stock. Supplier prices are managed in Supplier offers.</p>
    <p className="form-hint">Changing minimum stock can make a pending recommendation stale and prevent approval.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><button type="button" className="button subtle" onClick={onCancel}>Cancel</button><button className="button primary">{onSubmitValues ? 'Save item' : 'Save demo item changes'}</button></div>
  </form>
}
