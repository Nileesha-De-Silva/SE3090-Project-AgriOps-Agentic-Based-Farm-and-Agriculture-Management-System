// Same-origin routes: Vite proxies these locally; production needs a reverse proxy.
// Only manager access tokens belong in this client. No provider/service secrets.
export class ApiError extends Error {
  constructor(message, status = 0, uncertain = false) {
    super(message)
    this.status = status
    this.uncertain = uncertain
  }
}

export function createApiSession(options = {}) {
  let token = ''
  return {
    api: createApi({ ...options, getToken: () => token }),
    setToken(value) { token = value.trim() },
    clearToken() { token = '' },
  }
}

export function createApi({ getToken = () => '', fetchImpl = globalThis.fetch, timeoutMs = 120000 } = {}) {
  async function request(path, method = 'GET', body, protectedRoute = false) {
    const token = getToken().trim()
    if (protectedRoute && !token) throw new ApiError('Connect a valid manager access token first.', 401)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(path, {
        method, signal: controller.signal, cache: 'no-store', redirect: 'error',
        headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
      if (!response.ok) {
        const messages = { 400: 'Check the entered values. The server rejected this request.', 401: 'Your manager session is missing or expired. Reconnect with a valid token.',
          403: 'This account does not have permission for this action.', 404: 'The record or service route was not found. Refresh the workspace.',
          409: 'The data changed, a recommendation is already pending, or the agent is busy. Refresh before trying again.',
          422: 'Check the item, weekly estimate and request fields.', 503: 'The service is not ready. Check agent configuration and backend availability.' }
        throw new ApiError(messages[response.status] || 'The service could not complete the request.', response.status, method !== 'GET' && response.status >= 500)
      }
      if (response.status === 204) return null
      // A missing production proxy often serves index.html with HTTP 200.
      if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError('Expected API JSON. Check the API proxy configuration.', 0, method !== 'GET')
      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError('Could not reach the service or the request timed out. Check that both servers are running.', 0, method !== 'GET')
    } finally { clearTimeout(timer) }
  }
  const id = value => encodeURIComponent(value)
  return {
    inventorySession: () => request('/api/inventory/session', 'GET', undefined, true),
    verifyManager: () => request('/api/inventory-agent/access', 'GET', undefined, true),
    async loadWorkspace(includeProtected = false) {
      const [items, suppliers, recommendations, purchases] = await Promise.all([
        request('/api/inventory'), request('/api/suppliers'),
        includeProtected ? request('/api/reorder-recommendations', 'GET', undefined, true) : [],
        includeProtected ? request('/api/purchase-requests', 'GET', undefined, true) : [],
      ])
      const [offers, histories] = await Promise.all([
        Promise.all(suppliers.map(s => request(`/api/suppliers/${id(s.id)}/items`))),
        Promise.all(items.map(i => request(`/api/inventory/${id(i.id)}/transactions`))),
      ])
      return {
        items,
        suppliers: suppliers.map((s, index) => ({ ...s, contactPerson: s.contactPerson || '', email: s.email || '', phone: s.phone || '', address: s.address || '',
          initials: s.name.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase(), offers: offers[index].map(o => ({ ...o, itemId: o.inventoryItemId })) })),
        movements: histories.flat().map(m => ({ ...m, itemId: m.inventoryItemId, type: m.transactionType, createdAt: m.transactionDate })),
        recommendations: recommendations.map(r => ({ ...r, itemId: r.inventoryItemId, quantity: r.recommendedQuantity, minimumAtProposal: r.minimumStockAtProposal, note: r.decisionNote, purchaseId: r.purchaseRequestId })),
        purchases: purchases.map(p => ({ ...p, itemId: p.inventoryItemId, quantity: p.requestedQuantity, recommendationId: recommendations.find(r => r.purchaseRequestId === p.id)?.id })),
      }
    },
    saveItem: (itemId, values) => request(`/api/inventory${itemId ? `/${id(itemId)}` : ''}`, itemId ? 'PUT' : 'POST', {
      name: values.name.trim(), category: values.category.trim(), unitOfMeasurement: values.unitOfMeasurement.trim(),
      minimumStockLevel: Number(values.minimumStockLevel), unitCost: Number(values.unitCost),
    }, true),
    saveSupplier: (supplierId, values) => request(`/api/suppliers${supplierId ? `/${id(supplierId)}` : ''}`, supplierId ? 'PUT' : 'POST', {
      name: values.name.trim(), contactPerson: values.contactPerson?.trim() || null, email: values.email?.trim() || null,
      phone: values.phone?.trim() || null, address: values.address?.trim() || null,
    }, true),
    saveOffer: (supplierId, itemId, values, editing) => request(`/api/suppliers/${id(supplierId)}/items/${id(itemId)}`, editing ? 'PUT' : 'POST', {
      unitPrice: Number(values.unitPrice), leadTimeDays: Number(values.leadTimeDays), isAvailable: values.isAvailable,
    }, true),
    recordMovement: (itemId, values) => request(`/api/inventory/${id(itemId)}/transactions`, 'POST', {
      transactionType: values.type, quantity: Number(values.quantity), notes: values.notes?.trim() || null,
    }, true),
    decide: (recommendationId, approve, note) => request(`/api/reorder-recommendations/${id(recommendationId)}/${approve ? 'approve' : 'reject'}`, 'POST', { note }, true),
    recommend: body => request('/api/inventory-agent/recommend', 'POST', body, true),
    run: runId => request(`/api/inventory-agent/runs/${id(runId)}`, 'GET', undefined, true),
    resume: runId => request(`/api/inventory-agent/runs/${id(runId)}/resume`, 'POST', undefined, true),
  }
}
