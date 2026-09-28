# Live frontend and Ask Agent — development setup

Updated 2026-09-27 for the assignment's mandatory backend-mediated architecture.
The browser demo and workspace switch have been removed. Both React and Flutter
communicate only with ASP.NET Core. Python runs as an internal service.

## Start manually in separate terminals

Start each terminal at the repository root.

Backend:

```powershell
cd backend/AgriOpsAI.Api
$env:InventoryAgent__BaseUrl = 'http://127.0.0.1:8003/'
dotnet run --launch-profile http
```

Python (existing server-side Gemini and service-token configuration required):

```powershell
cd agents/inventory-agent
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003 --workers 1
```

Web:

```powershell
cd web
npm run dev
```

Restart .NET and Vite after these routing changes. Open Vite's printed URL.
Connect/load catalogue. A valid manager token is required for protected actions.

## Routing

Browser `/api/*` → Vite development proxy → ASP.NET Core.
Agent requests use these .NET routes:

- POST `/api/inventory-agent/recommend`
- GET `/api/inventory-agent/runs/{id}`
- POST `/api/inventory-agent/runs/{id}/resume`

The gateway enforces Manager policy and forwards the manager bearer identity to
Python. Python verifies it through .NET and scopes checkpoints to the manager.
The body and run ID remain unchanged. Python uses its separate agent JWT to save
recommendations. Manager approval continues directly through .NET.

`InventoryAgent__BaseUrl` defaults to loopback port 8003 and requires HTTPS for
non-loopback destinations. It is a trusted server configuration, not a client
parameter. Redirects are disabled and writes are never automatically retried.
Keep Python bound to loopback locally, or reachable only over the internal service
network in deployment. Do not expose its port through the public frontend proxy.

`web/.env.example` contains only the non-secret backend proxy target. The obsolete
`AGENT_PROXY_TARGET` is no longer used. Production needs an HTTPS reverse proxy
for `/api` to .NET; Vite development proxy settings do not deploy automatically.

## Identity and current limits

The temporary development connection accepts an existing manager JWT issued by
the configured identity provider. Browser tokens are memory-only; mobile tokens
use device secure storage. Neither client issues tokens or implements group
registration/login yet. Never put service tokens or Gemini keys in a client.

Catalogue endpoints currently lack controller authorization. Web editing controls
require manager verification, but that is not server-side protection for raw
catalogue writes. The group must add agreed catalogue permissions before deployment.
Recommendation/purchase policies stay enforced; no JWT bypass is introduced.

The agent plans for one selected item. The message expresses supplier preferences;
it cannot alter calculated quantities or manager approval. Weekly usage estimates
are only a fallback for insufficient history. Stock, incoming quantities and
supplier offers remain backend evidence. Generic receipts are not yet linked
to purchase fulfilment.

## Failure behavior

An interrupted stock/contact write may already be saved: refresh and inspect
history before repeating it. Confirmed writes followed by failed refresh are
reported as saved. No API failure substitutes synthetic data.

Agent checks/retries retain the same request ID and input. Copy the web run ID
before reloading an unresolved request. Mobile retains its current request in
secure storage for the same verified manager. Pending proposals still prevent
another pending proposal for the same item. Resume observes an existing backend
manager decision; it does not approve a recommendation.

## Manual verification

From `web`:

```powershell
npm run lint
npm test
npm run build
```

From the repository root:

```powershell
dotnet run --project .\tests\AgentGatewayChecks
```

All changes in the mobile/gateway slice are pending user-run checks.
Earlier passes do not establish the new gateway's live connectivity.

1. Load catalogue with no token in web: real data, protected actions disabled.
2. Connect a valid manager: load protected lists and perform a stock movement.
3. Ask Agent: network requests must use only .NET `/api` routes; save a Pending
   recommendation and inspect its reason and evidence.
4. Approve once: exactly one purchase request and unchanged stock.
5. Verify expired/agent-only tokens cannot access gateway routes.
6. Stop Python: show an error and retain the run ID, never fabricate a result.
7. Complete the [mobile cross-client checklist](mobile-test-log.md).
