# AgriOps web frontend

React + Vite client for Component 3. The page loads real API data; there is no
browser demo mode. Existing synthetic fixtures remain only for offline tests and
shared validation helpers.

## Run manually

From `web`:

```powershell
npm ci
npm run dev
```

Keep ASP.NET Core running. Vite forwards only `/api/*` to .NET.
Ask Agent uses the manager-authorized .NET gateway; Python is internal.
Configure `BACKEND_PROXY_TARGET` in `.env.local` only if changing the backend port.
Configure `InventoryAgent__BaseUrl` on .NET, never in frontend configuration.
Restart Vite and .NET after the routing change.

## Screens

- Inventory: search, stock filters, item editing, stock movements/history and
  supplier offers.
- Suppliers: contacts, contact editing and a read-only supplied-item list.
  Offer editing remains in Inventory to avoid maintaining it in two places.
- Ask Agent: selected item, supplier preferences, optional weekly estimate,
  safety buffer, real model recommendation and run recovery/status.
- Recommendations: backend evidence and manager approval/rejection.
- Purchases: requests created from approved recommendations.

Only the backend calculates authoritative stock and approval outcomes. Approval
creates a purchase request, not a stock receipt or supplier order. Delivery times
are configured estimates, not measured supplier history.

The development connection accepts an existing manager JWT in memory. Group
login is pending. Never put Gemini keys or agent service tokens in browser code.
Catalogue controller authorization still needs the group's agreed server-side
policies before production; disabled UI controls alone are not authorization.

## Verify manually

```powershell
npm run lint
npm test
npm run build
```

The existing 28 tests cover fixture business rules and the API adapter. The gateway
routing change needs these checks rerun. See [live setup](../docs/live-frontend-setup.md)
and [mobile integration checks](../docs/mobile-test-log.md).
