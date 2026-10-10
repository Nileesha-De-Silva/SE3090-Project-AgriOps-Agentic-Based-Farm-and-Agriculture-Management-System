import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SupplierOffers } from '../SupplierForms'
import { createApi } from '../api'

describe('supplier offer expiration', () => {
  it('sends the selected date through the live API and displays it after reload', async () => {
    let saved
    const fetchImpl = vi.fn(async (_url, options) => {
      saved = JSON.parse(options.body)
      return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => saved }
    })
    const api = createApi({ getToken: () => 'test-token', fetchImpl })
    const data = { items: [{ id: 'item', name: 'Seed packets', unitOfMeasurement: 'packet' }], suppliers: [{ id: 'supplier', name: 'Seed supplier', offers: [{ itemId: 'item', unitPrice: 100, leadTimeDays: 3, isAvailable: true }] }] }
    const submit = vi.fn((supplierId, values, editing) => api.saveOffer(supplierId, 'item', values, editing))
    const props = { data, itemId: 'item', onSubmitValues: submit }
    const view = render(<SupplierOffers {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit offer from Seed supplier' }))
    fireEvent.change(screen.getByLabelText('Expiration date (optional)'), { target: { value: '2027-12-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save offer' }))
    await waitFor(() => expect(saved?.expirationDate).toBe('2027-12-31'))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Save offer' })).toBeNull())
    const next = { ...data, suppliers: [{ ...data.suppliers[0], offers: [{ ...data.suppliers[0].offers[0], expirationDate: saved.expirationDate }] }] }
    view.rerender(<SupplierOffers {...props} data={next} />)
    expect(screen.getByText('2027-12-31')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Edit offer from Seed supplier' }))
    expect(screen.getByLabelText('Expiration date (optional)').value).toBe('2027-12-31')
  })
})
