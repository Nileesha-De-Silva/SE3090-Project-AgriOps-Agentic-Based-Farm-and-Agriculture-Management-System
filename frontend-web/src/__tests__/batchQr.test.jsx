import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { BatchQrLabel } from '../InventoryBatchPanel'
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(async () => 'data:image/png;base64,test') } }))
afterEach(cleanup)
describe('batch QR details', () => {
  it('shows current batch quantity and reloads it behind the same label', async () => {
    const batch = { id: 'batch', itemName: 'Seed packets', unitOfMeasurement: 'packet', remainingQuantity: 5, totalItemStock: 9, status: 'Available', expirationDate: '2027-12-31', qrPayload: 'agriops:batch:batch' }
    const api = { batch: vi.fn().mockResolvedValueOnce(batch).mockResolvedValueOnce({ ...batch, remainingQuantity: 3, totalItemStock: 7 }) }
    render(<BatchQrLabel api={api} batchId="batch" />)
    expect(await screen.findByText('5 packet remaining in this batch')).toBeInTheDocument()
    expect(screen.getByText('2027-12-31')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Refresh quantity' }))
    expect(await screen.findByText('3 packet remaining in this batch')).toBeInTheDocument()
    expect(api.batch).toHaveBeenNthCalledWith(2, 'batch')
  })
  it('does not show historical untracked stock as an available zero or original receipt quantity', async () => {
    const api = { batch: vi.fn().mockResolvedValue({ id: 'old', itemName: 'Old receipt', unitOfMeasurement: 'kg', remainingQuantity: null, totalItemStock: 10, status: 'Historical receipt — batch not tracked', qrPayload: 'agriops:batch:old' }) }
    render(<BatchQrLabel api={api} batchId="old" />)
    expect(await screen.findByText('Quantity not tracked')).toBeInTheDocument()
    expect(screen.queryByText('0 kg remaining in this batch')).not.toBeInTheDocument()
  })
  it('can update batch details without changing its QR identity', async () => {
    const batch = { id: 'batch', itemName: 'Seed packets', unitOfMeasurement: 'packet', remainingQuantity: 5, totalItemStock: 5, receivedAt: '2026-10-10', status: 'Available', expirationDate: '2027-12-31', qrPayload: 'agriops:batch:batch' }
    const api = { batch: vi.fn().mockResolvedValue(batch), updateBatch: vi.fn(async (_id, values) => ({ ...batch, ...values })) }
    render(<BatchQrLabel api={api} batchId="batch" canManage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Edit batch details' }))
    fireEvent.change(screen.getByLabelText('Shelf location'), { target: { value: 'Shelf B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save batch details' }))
    await waitFor(() => expect(api.updateBatch).toHaveBeenCalledWith('batch', expect.objectContaining({ shelfLocation: 'Shelf B' })))
    expect(await screen.findByText(/Shelf B/)).toBeInTheDocument()
    expect(screen.getByText('5 packet remaining in this batch')).toBeInTheDocument()
  })
})
