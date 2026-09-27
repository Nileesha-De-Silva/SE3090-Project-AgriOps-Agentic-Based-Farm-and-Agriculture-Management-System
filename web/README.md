# AgriOpsAI web frontend

React + Vite frontend for Component 3 (inventory and agricultural resources).
The only workspace connects to .NET and Python; the browser demo and mode switch
have been removed. Start the backend before loading the catalogue;
see [live setup and verification](../docs/live-frontend-setup.md). Android Studio
is not required.

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

- Inventory: search, low/healthy-stock filters, add/edit item, receive/use stock,
  movement history, supplier offers and **Plan reorder** demand calculations.
- Suppliers: searchable supplier contacts, contact editing and read-only supplied
  inventory. Prices, availability and delivery estimates are edited in Inventory.
- Recommendations: sample evidence, cost/delivery tradeoff, status filter, manager
  approval/rejection confirmation and optional decision notes.
- Purchase requests: list seeded and newly approved demo requests.

In Browser demo, all data is synthetic and held in React memory. Refresh resets the demo; the
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

`src/api.js` maps backend DTOs, `src/LiveWorkspace.jsx` contains the connected
workspace, and `src/AskAgent.jsx` sends bounded supplier preferences with structured
planning inputs. The local Vite proxy routes requests without broad CORS changes.
Manager approval uses the .NET endpoint. Never put the agent token or Gemini key
in browser code. Team login remains pending; the temporary development connection
accepts an existing manager token in memory. Live behaviour is awaiting verification.
Item deletion, order dispatch and delivery tracking are not included in this slice.

## Demand planning

Choose **Inventory → Plan reorder**. Enter expected weekly usage for new items or
items without a full 28-day history, and adjust the default seven safety days.
Calculate to compare each available supplier's reorder point, target, quantity
and shortage risk. Create a demo recommendation, then review it on Recommendations.
Approval creates one request; it does not send an order or change stock.

Weekly average = recorded Use quantity over 28 days / 4. Monthly demand uses 30
days. The target covers at least 30 days (longer if the supplier's lead time is
longer), plus safety stock. Incoming requests reduce quantity, but their arrival
dates are unknown. Low-stock badges still describe the fixed minimum; **Plan
reorder** can recommend purchasing before that minimum is reached.

See [demand planning and manual checks](../docs/demand-planning-test-log.md).

## Verify

```powershell
npm run build
npm run lint
npm test
```

See [frontend verification](../docs/frontend-test-log.md) for results and browser
checks. Production build output is in ignored `dist/`; dependencies are ignored too.
