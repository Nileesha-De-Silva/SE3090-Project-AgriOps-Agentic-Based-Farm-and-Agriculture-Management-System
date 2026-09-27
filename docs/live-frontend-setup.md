# Live frontend and Ask Agent — development setup

## Current UI: real workspace only

The demo screen and Browser demo / Live API switch have been removed at the user's
request. Open the frontend directly, then select Connect / load catalogue. The
backend must be running. Manager-only actions still require a valid manager token.
Ask Agent now has only the real Python request path. Historical mode-switch and
demo walkthrough instructions below describe the preceding version and no longer
apply. Existing fixtures remain for offline tests, not as a user-selectable page.
This UI change has not been linted or built by Codex; manual checks are pending.

Implemented 27 September 2026. Verification is pending the user's manual commands.
No services, build, tests, provider calls, commits or pushes were run for this slice.

## What is connected

The bottom-right switch selects Browser demo or Live API. Switching modes resets
the current workspace session; it never deletes backend data. Demo fixtures are
never submitted or used as a fallback when the API fails.

Live API reads inventory, suppliers, supplier offers and movement history from
.NET. With verified manager access it also reads recommendations and purchases,
saves item/contact/offer edits, records movements and calls approval/rejection.
The backend supplies record IDs and is authoritative for stock and decisions.
Supplier offers remain editable only from Inventory; Suppliers shows contacts
and a read-only supplied-item list.

Ask Agent calls Python `/recommend`, then displays the saved backend proposal.
It supports one explicitly selected inventory item and a 30-day demand plan.
The text box supplies price/delivery preferences to Gemini; it is not a general
chat parser. Selecting items, weekly estimates and safety days stays explicit.
Messages cannot alter calculated quantities, eligible offers or approval rules.
The demo Ask Agent panel explicitly does not send its message to Gemini and uses
the deterministic planner instead.

## Authentication boundary

Catalogue endpoints currently have no controller authorization in the existing
backend. Live mode permits catalogue reads without a token, while its editing
controls require a manager verified through `/api/inventory-agent/access`.
That UI restriction is NOT server authorization for catalogue writes. The team
must agree and add server-side catalogue policies before production deployment.
Recommendation and purchase policies remain enforced by the backend.

The temporary development connection accepts an existing manager access token.
It does not issue tokens or replace team login. Tokens are held only in memory;
the input is cleared on submission, and disconnect, reload or leaving live mode
clears the token. Nothing stores it in browser storage or Vite configuration.

The Python `.env` still requires its separate `BACKEND_AGENT_TOKEN`, `GEMINI_API_KEY`
and `CHAT_MODEL`. Never paste those service/provider secrets into the frontend.
Never put tokens or keys in `VITE_*` variables: those are bundled into browser code.

## Run manually in separate terminals

Start each terminal in the repository root. Keep each service running.

Backend (uses the existing local PostgreSQL configuration and applied migrations):

```powershell
cd backend/AgriOpsAI.Api
dotnet run --launch-profile http
```

Frontend:

```powershell
cd web
npm run dev
```

Restart Vite if it was running before the proxy configuration changed. Open the
URL it prints, choose Live API, leave the token blank and select Connect / load
catalogue. You can verify real catalogue reads before team authentication is ready.

Python, when its configuration and valid service token are available:

```powershell
cd agents/inventory-agent
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003 --workers 1
```

The manager token must be issued for the .NET API's configured issuer/audience and
role. Configure the team identity provider; do not disable validation or create a
fake token. Connect the manager token in Live API, then use Ask Agent.

## Routing

The browser uses same-origin `/api/*` for .NET and `/agent-api/*` for Python.
Vite proxies to `http://localhost:5289` and `http://127.0.0.1:8003` by default.
For other ports, copy `web/.env.example` to `web/.env.local`, change only the two
non-secret proxy targets, then restart Vite. TLS certificate checks are not disabled.

These proxies are for Vite development only. A production deployment needs an
HTTPS reverse proxy with the same paths, stripping `/agent-api` before forwarding
to Python. `npm run build` or `npm run preview` alone does not provide that routing.
No CORS wildcard or authentication bypass was added.

## Failure handling

- No automatic mutation retries. Interrupted catalogue writes may already have
  saved; refresh and inspect records/history before submitting another write.
- A confirmed save followed by failed reload is reported as saved, with editing
  paused until refresh succeeds.
- Agent retries reuse the request ID and identical input. Check request retrieves
  the checkpoint; Resume request resumes it when the API reports `canRetry`.
  Copy the displayed request ID before reloading during an unresolved request.
  After reconnecting, review saved recommendations before generating another.
- A changed message or planning input requires a new request. Pending proposals
  still prevent duplicates for the same item.
- Approval uses the .NET manager endpoint. The Python approval interrupt does not
  need to resume for purchase creation; the stored decision is authoritative.
  Its `/runs/{id}/resume` endpoint can separately observe an approved/rejected run.

## Verification to run manually

From `web`:

```powershell
npm run lint
npm test
npm run build
```

Expected frontend tests: 27 (19 existing + 8 API contract/error tests).

From `agents/inventory-agent`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests -q -p no:cacheprovider
```

Expected Python tests: 35 (34 existing + message constraints/retry identity).
Tests use doubles; passing does not establish live identity-provider or Gemini connectivity.

Manual browser checks:

1. Browser demo → Ask Agent: no Gemini/network claims; select an item and preview
   the existing demand plan. Creating a demo proposal never calls the API.
2. Live API without token: catalogue reflects PostgreSQL, protected lists prompt
   for manager access, and mutations are disabled. Stop the API and refresh:
   show an error, never substitute sample records.
3. With valid manager access: register/edit a supplier, add/edit an item, link its
   offer from Inventory, record a movement and reload. Records must persist.
4. Ask Agent with the item selected: enter a supplier preference and weekly estimate
   if necessary. Inspect the saved Pending proposal and trace, then approve once.
   Exactly one backend purchase request must appear; stock must not change.
5. Expired/wrong-role tokens must fail. Disconnect and verify protected data and
   token are cleared. Confirm interrupted writes do not retry automatically.
6. Try narrow/mobile layouts, keyboard navigation, dialog close and disabled states.

Limits: catalogue load currently makes per-item history and per-supplier offer
requests; pagination/batching is future work for a larger dataset. Purchase receipts
are still not linked to incoming orders. This is a local integration slice, not a
production-ready deployment or completed identity-provider integration.
