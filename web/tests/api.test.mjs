import test from 'node:test'
import assert from 'node:assert/strict'
import { createApi, createApiSession } from '../src/api.js'

const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

test('API session updates and clears its private token without replacing the client', async () => {
  const headers = []
  const session = createApiSession({ fetchImpl: async (_, options) => { headers.push(options.headers.Authorization); return json({}) } })
  const api = session.api
  session.setToken(' manager-one ')
  await api.verifyManager()
  session.setToken('manager-two')
  await api.verifyManager()
  session.clearToken()
  await assert.rejects(api.verifyManager(), error => error.status === 401)
  assert.deepEqual(headers, ['Bearer manager-one', 'Bearer manager-two'])
  assert.equal(session.api, api)
})

test('live catalogue maps API records without loading protected resources anonymously', async () => {
  const calls = []
  const records = {
    '/api/inventory': [{ id: 'i1', name: 'Seeds', currentStock: 4 }],
    '/api/suppliers': [{ id: 's1', name: 'Farm Supplier', phone: null }],
    '/api/suppliers/s1/items': [{ inventoryItemId: 'i1', unitPrice: 12 }],
    '/api/inventory/i1/transactions': [{ id: 'm1', inventoryItemId: 'i1', transactionType: 'Use', transactionDate: '2026-09-27T00:00:00Z', quantity: 2 }],
  }
  const api = createApi({ fetchImpl: async (path, options) => { calls.push([path, options]); return json(records[path]) } })
  const data = await api.loadWorkspace()
  assert.equal(data.items[0].id, 'i1')
  assert.equal(data.suppliers[0].offers[0].itemId, 'i1')
  assert.equal(data.suppliers[0].phone, '')
  assert.equal(data.movements[0].type, 'Use')
  assert.equal(data.movements[0].createdAt, records['/api/inventory/i1/transactions'][0].transactionDate)
  assert.equal(data.recommendations.length, 0)
  assert.equal(calls.length, 4)
  assert.ok(calls.every(([, options]) => !options.headers.Authorization))
})

test('protected requests use the current manager token and do not run without it', async () => {
  let token = ''
  const calls = []
  const api = createApi({ getToken: () => token, fetchImpl: async (path, options) => { calls.push([path, options]); return json({}) } })
  await assert.rejects(api.verifyManager(), error => error.status === 401)
  assert.equal(calls.length, 0)
  token = 'manager-one'
  await api.verifyManager()
  token = 'manager-two'
  await api.decide('rec1', true, 'Reviewed')
  assert.equal(calls[0][1].headers.Authorization, 'Bearer manager-one')
  assert.equal(calls[1][1].headers.Authorization, 'Bearer manager-two')
  assert.equal(calls[1][0], '/api/reorder-recommendations/rec1/approve')
  assert.deepEqual(JSON.parse(calls[1][1].body), { note: 'Reviewed' })
})

test('live writes whitelist DTO fields and never send client stock or demo IDs', async () => {
  const calls = []
  const api = createApi({ getToken: () => 'manager', fetchImpl: async (path, options) => { calls.push([path, options]); return json({}) } })
  await api.saveItem(null, { id: 'demo', currentStock: 999, name: ' Seeds ', category: 'Seeds', unitOfMeasurement: 'kg', minimumStockLevel: '20', unitCost: '12.50' })
  assert.deepEqual(JSON.parse(calls[0][1].body), { name: 'Seeds', category: 'Seeds', unitOfMeasurement: 'kg', minimumStockLevel: 20, unitCost: 12.5 })
  await api.recordMovement('i1', { type: 'Use', quantity: '1.25', notes: ' test ' })
  assert.deepEqual(JSON.parse(calls[1][1].body), { transactionType: 'Use', quantity: 1.25, notes: 'test' })
  await api.saveOffer('s1', 'i1', { unitPrice: '3', leadTimeDays: '2', isAvailable: false }, true)
  assert.equal(calls[2][1].method, 'PUT')
  assert.equal(JSON.parse(calls[2][1].body).isAvailable, false)
})

test('partial reads fail instead of falling back to demo or incomplete records', async () => {
  const api = createApi({ fetchImpl: async path => path === '/api/inventory' ? json([]) : json({}, 500) })
  await assert.rejects(api.loadWorkspace(), error => error.status === 500)
})

test('ambiguous writes are marked uncertain and never retried automatically', async () => {
  let calls = 0
  const api = createApi({ getToken: () => 'manager', fetchImpl: async () => { calls++; throw new Error('PRIVATE_PROVIDER_DETAILS') } })
  await assert.rejects(api.recordMovement('i1', { type: 'Use', quantity: 1 }), error => error.uncertain && !error.message.includes('PRIVATE'))
  assert.equal(calls, 1)
})

test('agent requests retain IDs and resume only through the agent route', async () => {
  const bodies = []
  const api = createApi({ getToken: () => 'manager', fetchImpl: async (path, options) => { bodies.push([path, options.body]); return json({}) } })
  const request = { request_id: 'fixed-run', inventory_item_id: 'i1', message: 'Compare delivery', safety_days: 7 }
  await api.recommend(request)
  await api.recommend(request)
    assert.equal(bodies[0][0], '/api/inventory-agent/recommend')
  assert.equal(bodies[0][1], bodies[1][1])
  await api.run('fixed-run')
  await api.resume('fixed-run')
  assert.equal(bodies[2][0], '/api/inventory-agent/runs/fixed-run')
  assert.equal(bodies[3][0], '/api/inventory-agent/runs/fixed-run/resume')
})

test('HTML proxy fallback is rejected instead of being treated as API data', async () => {
  const api = createApi({ fetchImpl: async () => new Response('<html>app</html>', { headers: { 'Content-Type': 'text/html' } }) })
  await assert.rejects(api.loadWorkspace(), /proxy configuration/)
})

test('protected review data maps recommendation snapshots and purchase relationships', async () => {
  const data = {
    '/api/inventory': [], '/api/suppliers': [],
    '/api/reorder-recommendations': [{ id: 'r1', inventoryItemId: 'i1', recommendedQuantity: 14, minimumStockAtProposal: 10, decisionNote: 'ok', purchaseRequestId: 'p1' }],
    '/api/purchase-requests': [{ id: 'p1', inventoryItemId: 'i1', requestedQuantity: 14 }],
  }
  const api = createApi({ getToken: () => 'manager', fetchImpl: async path => json(data[path]) })
  const result = await api.loadWorkspace(true)
  assert.equal(result.recommendations[0].quantity, 14)
  assert.equal(result.recommendations[0].minimumAtProposal, 10)
  assert.equal(result.purchases[0].recommendationId, 'r1')
})
