# AgriOps AI – Integrated Full-Stack & Agentic AI Farm Management System

<div align="center">

[![AgriOps CI/CD Pipeline](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-151%20Passed%20(100%25)-brightgreen?style=flat&logo=checkmarx&logoColor=white)](https://github.com/Nileesha-De-Silva/SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System/actions/workflows/ci-cd.yml)
[![.NET](https://img.shields.io/badge/.NET-10.0%20(82%20Tests)-512BD4?style=flat&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React%2018-Vitest%20(38%20Tests)-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x%20(22%20Tests)-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17%2B-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

> An intelligent, end-to-end farm operations and decision-support ecosystem integrating mobile field execution, administrative web governance, a centralized ASP.NET Core REST API, PostgreSQL relational persistence, and a multi-agent AI subsystem with human-in-the-loop validation.

The Flutter client is in [`mobile/`](mobile/README.md). It includes inventory
search, stock movements/history, supplier contacts, real agent submission/status,
recommendation/purchase activity and QR item scanning. Android setup and all new
checks are pending the user's manual commands; see [mobile test log](docs/mobile-test-log.md).
Shared login/registration remains pending the group's authentication integration.

Both React and Flutter now call ASP.NET Core only. Manager-authorized
`/api/inventory-agent/recommend` and `/api/inventory-agent/runs/{id}` (plus `/resume`)
forward to internal Python. Configure `InventoryAgent__BaseUrl` on the backend
(default `http://127.0.0.1:8003/`); the old direct Vite `/agent-api` proxy is removed.

## Inventory & Agricultural Resources

**Responsible Member:** IT24103140 - Nawarathna N.H.D.S

### Component Overview

This component is responsible for managing agricultural resources required for farm operations.

### Main Features

- Manage inventory items
- Track current stock levels
- Record resource consumption
- Record restocking transactions
- Manage suppliers
- Detect low-stock items
- Manage purchase requests
- Generate AI-based reorder recommendations
- Support manager approval/rejection of AI recommendations

### Low-stock API

`GET /api/inventory/low-stock` returns inventory items whose current stock
is strictly below their minimum stock level. Items at the minimum are excluded.
Results are ordered by shortage quantity descending, then name and ID.
No matches returns HTTP 200 with `[]`. The response uses the existing inventory
item fields and does not change stock or create purchase requests.
No database migration is required.

### Supplier API

- `GET /api/suppliers`: list suppliers by name and ID.
- `GET /api/suppliers/{id}`: retrieve one supplier (404 if missing).
- `POST /api/suppliers`: create a supplier (201 with a Location header).
- `PUT /api/suppliers/{id}`: replace supplier details (200 or 404).
- `DELETE /api/suppliers/{id}`: delete an unused supplier (204); linked items
  or purchase requests prevent deletion (409).

Name is required. Contact person, phone, email and address are optional.
Field lengths follow the existing schema; email format is validated.
See `docs/supplier-test-log.md` for the manual verification checklist.
### Supplier-item API

Use `/api/suppliers/{supplierId}/items` to list a supplier's linked items.
Use `/api/suppliers/{supplierId}/items/{inventoryItemId}` with GET, POST,
PUT or DELETE to retrieve, create, update or remove a link.

POST and PUT require all three fields:

```json
{ "unitPrice": 12.50, "leadTimeDays": 3, "isAvailable": true }
```

Price must be between 0 and 99999999.99 with at most two decimal places.
Lead time is a nonnegative whole number of days. A duplicate link returns 409;
missing resources return 404. An existing supplier without links returns `[]`.
Unavailable links remain visible so their details can be maintained.
DELETE removes the link only; supplier and inventory records remain unchanged.
No database migration is required.

Run `pwsh -File scripts/test-supplier-items.ps1` with the local API running to
verify the feature. The script creates and removes temporary test records.
### Recommendation approval and purchase requests

The required sequence is:

```text
Inventory agent reads live stock and suppliers
  -> proposes a recommendation (Pending, stored in PostgreSQL)
  -> manager reviews quantity, supplier, price, lead time and reason
     -> Reject: recommendation becomes Rejected; no purchase request
     -> Approve: recommendation becomes Approved + one purchase request
  -> Receive transaction only when goods actually arrive
```

The Python inventory agent is implemented in `agents/inventory-agent`, matching
the farm-planning agent app structure. It uses Gemini structured supplier selection,
LangGraph and durable SQLite human approval checkpoints. Automated tests use
synthetic model fixtures; real model and team identity integration remain unverified.

| Endpoint | Caller | Purpose |
|---|---|---|
| POST /api/reorder-recommendations | InventoryAgent | Submit a proposal; never creates a purchase request |
| GET /api/reorder-recommendations | Manager or InventoryAgent | List durable recommendations |
| GET /api/reorder-recommendations/{id} | Manager or InventoryAgent | Read one recommendation |
| POST /api/reorder-recommendations/{id}/approve | Manager | Approve and create one linked purchase request atomically |
| POST /api/reorder-recommendations/{id}/reject | Manager | Reject without creating a purchase request |
| GET /api/purchase-requests | Manager | List resulting requests, newest first |
| GET /api/purchase-requests/{id} | Manager | Retrieve one resulting request |

Direct purchase-request POST and purchase-request approve/reject routes have been
removed. The approval target is the recommendation. Earlier database rows are
preserved as legacy records; no approvals or links are invented for them.

A proposal requires `agentRunId`, `model`, `inventoryItemId`, `supplierId`,
`recommendedQuantity`, and `reason`. Quantity must be positive, at most
99999999.99, with at most two decimal places. Reason is required, up to 500
characters. The item must be below its minimum and have an available supplier
link. Stock, minimum, unit, price and lead time are captured by the server.
Estimated cost is computed using decimal arithmetic and rounded to two places.

<<<<<<< HEAD
WeatherRecords
AuditLogs

---

## 🧪 Automated Testing & Continuous Integration (CI/CD)

The platform is fortified with an automated testing ecosystem covering **100% of core layers** across Component 1 and Component 2:

| Test Suite / Layer | Framework | Tests | Purpose | Status |
| :--- | :--- | :---: | :--- | :---: |
| **`AgriOps.Tests` (Backend Unit)** | xUnit (.NET 10) | **65** | Unit tests for domain calculations (growth stages), controller DTO projections, worker skill matching algorithms, and task state machines. | **PASSED (100%)** |
| **`AgriOps.IntegrationTests`** | xUnit + PostgreSQL | **17** | End-to-end integration tests over in-process Kestrel HTTP against a dedicated PostgreSQL database, testing real API routing, AI approval gates, and database persistence. | **PASSED (100%)** |
| **`frontend-web` (React Dashboard)** | Vitest + React Testing Library | **38** | Component rendering, role-based navigation, farm/field forms, task modals, AI approval cards, and mock API integration. | **PASSED (100%)** |
| **`mobile` (Flutter Client)** | Flutter Test | **22** | Mobile widget rendering, navigation bar, task status transitions, evidence submission forms, and theme styling. | **PASSED (100%)** |
| **`ai-subsystem` (LangGraph Agent 2)** | Pytest | **9** | LangGraph StateGraph, tool schemas, dosage calculations, query rewriting, human-in-the-loop interruption, and FastAPI endpoints. | **PASSED (100%)** |
| **Total Automated Suite** | All Layers | **151** | Comprehensive end-to-end regression safety across backend, web, mobile, and AI agent. | **151 / 151 PASSED** |

### Running Tests Locally

```powershell
# 1. Run Backend .NET Tests (82 tests):
dotnet test AgriOps.sln --logger "console;verbosity=normal"

# 2. Run React Web Frontend Tests (38 tests):
cd frontend-web
npm test
cd ..

# 3. Run Flutter Mobile Tests (22 tests) & Analyzer:
cd mobile
flutter test
flutter analyze
cd ..

# 4. Run AI Agent Subsystem Tests (9 tests):
.venv\Scripts\pytest ai-subsystem\tests
```

### GitHub Actions CI/CD Pipeline
- **Workflow File**: [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml)
- **Continuous Integration (CI)**: Automatically spins up an ephemeral PostgreSQL 17 container on every `push` and `pull_request` to `main` and `development`, runs code formatting checks, builds the solution, and executes all automated backend, web, and mobile tests.
- **Continuous Delivery (CD)**: Packages the release binary, creates Docker container artifacts, and manages staging and production deployment steps.


=======
The same run/item and identical payload returns the original proposal. Changed
payload for that run or another pending proposal for the item returns 409.
The agent must reuse its run ID on retries. Run IDs are correlation identifiers,
not authorization credentials.

Manager decision bodies are `{ "note": "Reviewed" }` or `{}`. Actor subject,
issuer and decision time come from the authenticated manager and server. Approval
revalidates stock, minimum, unit, availability, price and lead time. Changed data
returns 409, leaving the proposal Pending so it can be rejected and regenerated.
Repeating the same decision returns the existing result; the opposite decision
returns 409. Row locking, a single transaction and a unique purchase link prevent
retries/concurrent approval from producing duplicate requests.

Created purchase requests start Approved because their recommendation has already
been approved. No second approval is needed. Decisions never change stock, record
receipts or send supplier orders. Receiving and purchase fulfilment remain separate
work. One approved recommendation creates one request. The agent subtracts
Pending/Approved purchase quantities from shortage; fulfilment must still link
receipts to orders so delivered quantities stop counting as incoming.

### Identity integration

The API validates bearer JWT signatures, trusted issuer, audience and expiry.
Configure through environment variables or development user secrets:

| Setting | Value |
|---|---|
| Authentication__Authority | Team identity provider HTTPS authority URL with OIDC discovery/signing keys |
| Authentication__Audience | Audience registered for this API |
| Authentication__RoleClaimType | Role claim name; default `role` |
| Authentication__ManagerRole | Human manager role; default `Manager` |
| Authentication__AgentRole | Separate agent service-account role; default `InventoryAgent` |

For user secrets, use colon-separated keys, e.g. `Authentication:Authority`.
Both identities need a nonempty `sub` and a trusted `iss`. A principal with both
roles cannot submit or approve recommendations. Give the agent its own identity;
never pass a manager token to the model or agent tools. Recommendation reads are
shared across these two roles in the current single-farm prototype; multi-farm
ownership filtering is not implemented. Existing stock/supplier endpoints retain
their current access model and are not all production-authorized yet.

No login screen, account provisioning or token issuance is provided here. Without
team identity-provider settings, protected calls cannot be exercised with real
team tokens. Tests use ephemeral keys confined to their test host.

### Migration and verification

From the repository root:

```powershell
dotnet ef database update --project backend/AgriOpsAI.Api
dotnet run --project tests/PurchaseRequestChecks
```

The additive `AddReorderRecommendations` migration creates recommendation storage
and constraints without altering existing purchase requests. It has been applied
to the local development database. The test project uses the real application
pipeline and configured development database, creates isolated temporary records,
and removes only its generated IDs. It tests the manager gate without an LLM call.
See `docs/purchase-request-test-log.md` for results and remaining checks.

### Agent implementation references and next steps

See [agent setup and API examples](agents/inventory-agent/README.md),
[course reference plan](docs/agent-reference-plan.md) and
[agent test results](docs/inventory-agent-test-log.md). Supplier lead times currently
represent configured estimates. Historical comparison needs actual sent/received
dates for each supplier and product; it is the next procurement lifecycle addition.

### Web and mobile clients

The React workspace in `web` uses real ASP.NET Core records and the backend agent
gateway. Start its Vite server with `npm run dev`; there is no demo mode. See
[web setup](web/README.md). The Flutter inventory companion lives in `mobile`;
see [Android setup](mobile/README.md). Both use existing manager tokens during
development until the group integrates shared login. Neither client contains
Gemini or agent-service credentials.
>>>>>>> origin/development2
