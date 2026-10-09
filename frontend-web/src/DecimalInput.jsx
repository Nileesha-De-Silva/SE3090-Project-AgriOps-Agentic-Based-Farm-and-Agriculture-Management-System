import { useState } from 'react'

export default function DecimalInput({ defaultValue = '', ...props }) {
  const [value, setValue] = useState(String(defaultValue))
  return <input {...props} type="number" inputMode="decimal" step="0.01" value={value}
    onChange={event => {
      const next = event.target.value
      if (/^\d*(\.\d{0,2})?$/.test(next)) setValue(next)
    }} />
}
