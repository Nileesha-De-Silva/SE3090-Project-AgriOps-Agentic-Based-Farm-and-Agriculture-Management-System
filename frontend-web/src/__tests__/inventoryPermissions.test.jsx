import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import LiveWorkspace from '../LiveWorkspace'

const state = vi.hoisted(() => ({ user: { id: 'user', username: 'tester' }, access: {}, protectedLoads: [] }))
vi.mock('../contexts/authcontext', () => ({ useAuth: () => ({ user: state.user, loading: false }) }))
vi.mock('../services/authToken', () => ({ getToken: () => 'test-session' }))
vi.mock('../AskAgent', () => ({ default: () => <div>Agent panel</div> }))
vi.mock('../api', () => ({ createApiSession: () => ({
  setToken: vi.fn(), clearToken: vi.fn(), api: {
    inventorySession: async () => state.access,
    loadWorkspace: async (protectedLoad) => {
      state.protectedLoads.push(protectedLoad)
      return { items: [{ id: 'item', name: 'Seed', category: 'Seeds', currentStock: 2, minimumStockLevel: 1, unitCost: 3 }], suppliers: [], movements: [], recommendations: [], purchases: [] }
    }
  }
}) }))
beforeEach(() => {
  state.user = { id: 'user', username: 'tester' }
  state.protectedLoads = []
  HTMLDialogElement.prototype.showModal = vi.fn(function () { this.setAttribute('open', '') })
})
afterEach(cleanup)
async function load(access) {
  state.access = access
  render(<MemoryRouter><LiveWorkspace /></MemoryRouter>)
  await screen.findByText('Seed')
}
describe('inventory role actions', () => {
  it('requires shared login instead of accepting pasted tokens', () => {
    state.user = null
    render(<MemoryRouter><LiveWorkspace /></MemoryRouter>)
    expect(screen.getByText('Sign in to view inventory')).toBeInTheDocument()
    expect(screen.queryByText('Load inventory')).not.toBeInTheDocument()
  })
  it('farmers can read but cannot edit or record movements', async () => {
    await load({ canManage: false, canUse: false, canReceive: false })
    expect(screen.queryByText('Add item')).not.toBeInTheDocument()
    expect(screen.queryByText('Record movement')).not.toBeInTheDocument()
    expect(state.protectedLoads).toEqual([false])
  })
  it('workers can use stock but cannot receive or edit it', async () => {
    await load({ canManage: false, canUse: true, canReceive: false })
    expect(screen.queryByText('Edit item')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Record movement'))
    await waitFor(() => expect(screen.getByRole('option', { name: 'Use stock' })).toBeInTheDocument())
    expect(screen.queryByRole('option', { name: 'Receive stock' })).not.toBeInTheDocument()
  })
  it('managers can edit and receive stock', async () => {
    await load({ canManage: true, canUse: true, canReceive: true })
    expect(screen.getByText('Edit item')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Record movement'))
    expect(screen.getByRole('option', { name: 'Receive stock' })).toBeInTheDocument()
    expect(state.protectedLoads).toEqual([true])
  })
})
