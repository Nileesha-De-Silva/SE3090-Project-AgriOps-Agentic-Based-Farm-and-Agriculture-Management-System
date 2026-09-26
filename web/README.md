# AgriOpsAI web frontend

React + Vite browser demo for Component 3 (inventory and agricultural resources).
Android Studio, the .NET API and Gemini credentials are not needed for this demo.

## Run

From the repository root:

```powershell
cd web
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://localhost:5173).
Node 20.20.2 was used for verification. The existing dependency lock file is used.

## Included screens

- Inventory: resource search, low/healthy-stock filters, add item, receive/use stock,
  movement history and stock-level indicators.
- Suppliers: searchable sample suppliers, item offers, prices, availability and
  configured delivery estimates.
- Recommendations: sample evidence, cost/delivery tradeoff, status filter, manager
  approval/rejection confirmation and optional decision notes.
- Purchase requests: list seeded and newly approved demo requests.

All data is synthetic and held in React memory. Refresh resets the demo; the
sidebar Reset demo action also restores fixtures. No browser storage, login,
backend calls, real model calls or supplier communication are implemented.
Demo decisions are not real authorization. No authentication checks were removed
from the backend. Sample prices use LKR as a display convention, not a new backend
currency contract. Delivery times are configured estimates, not delivery history.

Approval adds one demo purchase request without changing stock. Rejection creates
none. Changed stock or supplier evidence blocks stale approval. Stock movements
use integer hundredths for arithmetic and reject negative stock. Generic receipts
remain separate from purchase fulfilment, matching the current backend limitation.

## Structure and future integration

`src/App.jsx` contains the navigation, screens and dialogs; `src/App.css` contains
responsive styles. `src/demo.js` isolates fixtures and state transitions from UI.
`tests/demo.test.mjs` exercises the business transitions using Node's test runner.

When the group settles authentication, replace demo state transitions with the
existing backend APIs and add loading/error states for those requests. Use the
manager identity for approval; never put the agent service token or Gemini key in
browser code. Align API IDs/DTO mappings (demo IDs are deliberately human-readable).
Supplier editing, item editing/deletion, real agent invocation, persistent data,
order dispatch and delivery tracking are not included in this slice.

## Verify

```powershell
npm run build
npm run lint
npm test
```

See [frontend verification](../docs/frontend-test-log.md) for results and browser
checks. Production build output is in ignored `dist/`; dependencies are ignored too.
