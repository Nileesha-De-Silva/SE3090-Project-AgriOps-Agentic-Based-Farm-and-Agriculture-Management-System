# Inventory agent

FastAPI and LangGraph inventory specialist. The `app` layout matches the team's
farm-planning agent: `__init__.py`, `backend_client.py`, `config.py`, `graph.py`,
`main.py`, `nodes.py`, and `state.py`. Configuration lives in `.env.example`;
dependencies, this README and `.gitignore` live alongside `app`.

## Workflow

Read live backend evidence -> calculate shortage -> Gemini selects a supplier ->
validate structured output -> persist Pending recommendation -> SQLite checkpoint
and human interrupt -> observe the manager's backend decision.

The manager approves the recommendation through .NET, which atomically creates
one purchase request. Python cannot approve, create purchases or change stock.
Supplier selection is model-generated; quantities and costs use decimal arithmetic.
Omit `target_stock` to use demand planning: average weekly usage from 28 days,
30-day demand, supplier delivery time and a configurable safety buffer (default
seven days). Items younger than 28 days or with no recorded usage require a
positive `weekly_estimate`. An explicit `target_stock` retains the legacy
minimum-stock trigger for existing clients and the sample Gemini smoke test.
Quantity is target minus current stock minus outstanding purchase quantities.

## Run locally (PowerShell)

From this directory, with Python 3.11 or newer:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
Copy-Item .env.example .env
```

The lock file records the tested environment, including test dependencies.
`requirements.txt` is the direct runtime dependency list; `requirements-dev.txt`
adds pytest. Edit `.env` with the backend URL, a separate InventoryAgent JWT,
Gemini key and a model name available to your team. CHAT_MODEL is intentionally
blank; no model availability or free-tier entitlement is assumed.

The .NET backend must be running with its recommendation migration and real team
identity-provider settings. It validates issuer, audience, signature, expiry and
roles. This project does not issue tokens. The caller supplies a Manager JWT;
BACKEND_AGENT_TOKEN must belong to the separate InventoryAgent service identity.
Neither token is sent to Gemini. Keep `.env` and `data/` out of Git.

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003 --workers 1
```

Use one worker: the local prototype serializes graph calls and stores checkpoints
in SQLite. `/health` reports configuration presence, not provider connectivity.

## Test Gemini without backend authentication

Run the standalone script before integrating team tokens. It needs only
`GEMINI_API_KEY` and `CHAT_MODEL` in this directory's `.env`; leave
`BACKEND_AGENT_TOKEN` blank. Use a Gemini text model available to your project
that supports structured output. No backend server, Manager token or database
is needed. From this directory with dependencies installed:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Edit .env locally with your Gemini key and model ID, then run:
.\.venv\Scripts\python.exe test_gemini.py
```

This makes a real provider call with synthetic fertilizer and two supplier offers.
It reuses the agent's production prompt, decimal calculations and supplier-ID
validation. The sample shortage is 50 target minus 5 stock minus 10 incoming =
35 kg. One offer costs 120/unit with an estimated seven-day lead time; the other
costs 150/unit with an estimated two-day lead time. There is no required winning
supplier: inspect the model's explanation of the price/delivery tradeoff.

Successful output has `status: validated_sample`, `savedToBackend: false`, supplier
selection, estimated cost, evidence, model attempts and reported token count.
This is an unsaved demonstration, not a Pending or Approved recommendation.
The script makes at most two model attempts with the default 30-second timeout
per attempt. Calls use your project's quota/billing. It does not create SQLite
checkpoints or call backend routes. Production API authentication stays required.

Exit code 2 means missing/invalid configuration; 1 means selection failed after
bounded attempts. Check key, model access, quota and network connectivity. Provider
error text is suppressed to avoid exposing credentials. Do not commit the real key.

## Request and review

Example assumes `$managerToken` already contains a valid team-issued token and
`$itemId` identifies an existing item with available supplier offers:

```powershell
$headers = @{ Authorization = "Bearer $managerToken" }
$runId = [guid]::NewGuid().ToString()
$body = @{ request_id = $runId; inventory_item_id = $itemId; weekly_estimate = 14; safety_days = 7 } | ConvertTo-Json
$result = Invoke-RestMethod http://localhost:8003/recommend -Method Post -Headers $headers -ContentType application/json -Body $body
$result
```

The weekly estimate is used only when history is insufficient. When usable
history exists, recorded usage takes precedence. Omit `target_stock` for this
mode. The backend must have the `AddDemandSnapshots` migration applied.

Reuse the request ID and identical input on retries. Inspect `evidence`, `demandPlans`, `demand`, `trace`,
`quantity` and `recommendation`; `awaiting_approval` means the backend saved a
Pending proposal. A different input with the same request ID returns 409.

An optional `message` (up to 500 characters) supplies manager price/delivery
preferences. It is passed as bounded data to supplier selection, not as tool
instructions. It cannot change the selected item, numeric planning inputs or
approval rules. Changing the message requires a new request ID. The frontend
Ask Agent panel uses this contract; see [live setup](../../docs/live-frontend-setup.md).

With the Manager token, call either
`POST /api/reorder-recommendations/{recommendation.id}/approve` or `/reject` on
.NET with `{ "note": "Reviewed" }`. Then call:

```powershell
Invoke-RestMethod "http://localhost:8003/runs/$runId/resume" -Method Post -Headers $headers
```

Resume reads the actual backend decision. An `approved=true` body cannot grant
approval. Pending decisions return 409. GET `/runs/{runId}` retrieves checkpoints
for the authenticated manager; restart uses the same SQLite file. Transient
backend failures can be retried with `/resume`, retaining the submitted payload.
A blocked/stale proposal needs review and a fresh request ID after correction.

## Evidence and limits

- Demand calculation is deterministic and repeated by .NET before persistence.
  The model can choose only an eligible supplier; if an eligible supplier can
  deliver before on-hand stock runs out, slower at-risk offers are excluded.
  When all eligible offers risk a shortage, the snapshot flags it for the manager.
  Incoming orders reduce quantity but never count as on-hand stock for this risk
  check, because confirmed delivery dates are not implemented.
- History coverage uses the item's age and recorded Use transactions, excluding
  future and out-of-window entries. It assumes usage is recorded consistently;
  stockouts, missing records and seasonality can underestimate future demand.
  This endpoint runs on request; there is no scheduled inventory monitor yet.
- See [demand planning verification](../../docs/demand-planning-test-log.md).

- `leadTimeDays` is a configured supplier estimate, **not past delivery performance**.
  Current supplier comparisons use price and that estimate. Fastest delivery and
  lowest price may differ; the model explains its choice for manager review.
- Historical comparison needs actual order-sent and receipt timestamps linked to
  supplier and item, with partial deliveries recorded. Compare median delivery
  days, recent performance and completed-order count for the same product; use
  the configured estimate when history is insufficient. Approval/creation dates
  are not proof an order was sent. This history is not implemented yet.
- Pending/Approved purchase quantities are conservatively counted as incoming.
  Purchase fulfilment is not linked to inventory receipts yet, so these quantities
  cannot yet distinguish delivered from unreceived orders. Complete that lifecycle
  before relying on automatic repeat replenishment in real operations.
- The backend supplies at most 20 available offers. More offers block the run
  instead of silently selecting from an incomplete comparison.
- Evidence is validated again on submission; changes return 409. Manager approval
  also revalidates its snapshot. There is no automated order dispatch.
- Model attempts default to two, with bounded timeouts and graph steps. Names and
  supplier data are treated as untrusted input. Validation constrains actions;
  explanation quality still needs evaluation with the real model.
- This is a synchronous single-farm prototype. Team identity integration, live
  Gemini testing, UI integration and production job execution remain outstanding.

## Verification and references

```powershell
.\.venv\Scripts\python.exe -m pytest -q --tb=short
```

See [agent test log](../../docs/inventory-agent-test-log.md) and
[reference plan](../../docs/agent-reference-plan.md). The implementation uses
Lab 05's bounded model loop and traces, Lecture 05's model/tools/state separation,
and Lab 06's durable human interrupt. Course materials guide implementation;
they are not supplier or agricultural evidence. The graph is an explicit workflow,
not an unrestricted tool-calling agent.

## Shared Docker entry point

`main:app` and `app.main:app` now serve the same persistent, authenticated
LangGraph workflow. The root main.py is an entry-point adapter, not a second
recommendation algorithm. Both `runId` and `run_id` identify the same run.
`GET /access` checks the caller through the backend. `/resume` only observes
an Approved/Rejected decision already saved by the manager in the backend.
It cannot approve a proposal itself.

Set GEMINI_API_KEY, CHAT_MODEL and BACKEND_AGENT_TOKEN in the Compose environment.
BACKEND_AGENT_TOKEN must be a valid, unexpired InventoryAgent service token;
the caller's Manager JWT is separate. Never commit credentials. Docker keeps
SQLite checkpoints in the inventory-agent-data volume and runs one worker.
The backend uses InventoryAgent__BaseUrl=http://inventory-agent:8003/ internally.
Clients should supply request_id and reuse it for retries; omitting it creates
a new run and the returned runId must be retained for subsequent operations.
Missing credentials or backend/model failures return errors instead of
fabricated suppliers, quantities, or approvals. A configured health response
does not prove live provider connectivity.

## Automatic two-week reorder checks

The backend checks for new committed Use/Receive movements every 30 seconds while running,
including eligible usage after a restart. For items at least 28 days old with
positive usage in the last 28 days, average weekly usage is usage / 4 and the
trigger is strictly current stock < usage / 2. Equality does not trigger.
Incoming Pending/Approved purchases covering that threshold suppress a new
proposal. Pending recommendations and recommendations created after the most
recent usage also suppress duplicates (including a manager's rejection).
A new Use or Receive transaction allows another check. The worker remembers
processed movement IDs while running; unchanged items do not start new agent runs.
Failed runs may retry after cooldown. A receipt that restores sufficient stock
is checked without generating a recommendation.

The worker calls the service-authenticated /automatic/recommend endpoint.
Python rechecks the threshold with fresh evidence and uses the existing
LangGraph/Gemini selection and validated demand calculation with safety_days=14.
Reorder quantity targets the existing 30-day-or-lead-time demand plus this
14-day buffer, minus stock and incoming purchases; it is not just a top-up to
two weeks. Recommendations remain Pending until a manager decides via .NET.

Set InventoryAgent:ServiceToken in backend configuration (Compose maps
BACKEND_AGENT_TOKEN) to an unexpired InventoryAgent token. The agent still needs
its own BACKEND_AGENT_TOKEN, GEMINI_API_KEY and CHAT_MODEL. Configure
InventoryAgent:AutomaticReorderEnabled=false to disable scanning. Failures are
logged and retried after ten minutes per item; stock recording stays independent.
Missing history requires the existing manual estimate workflow. Check backend
logs for missing credentials, supplier/configuration problems or failed runs.
No schema migration is required. API keys and service tokens must not be committed.


### Permanent inventory service authentication

Run `./scripts/configure-inventory-service.ps1` from the repository root in PowerShell. It creates or reuses a random inventory service secret in the ignored root `.env`, preserves unrelated settings, and sets the current shell's backend environment. Do not commit or share this file.

For cloud deployment, configure the same `INVENTORY_AGENT_CLIENT_ID` and `INVENTORY_AGENT_CLIENT_SECRET` in your deployment secret store. Compose maps them to backend `InventoryAgent__ClientId`/`InventoryAgent__ClientSecret` and agent `BACKEND_AGENT_CLIENT_ID`/`BACKEND_AGENT_CLIENT_SECRET`. Configure a private `Jwt__Key` of at least 32 bytes for the backend and your Gemini key/model for the agent. Nonlocal backend connections require HTTPS.

The service exchanges these credentials at `POST /api/inventory-agent/service-token` for a 10-minute InventoryAgent JWT and renews 60 seconds before expiry, or once after an HTTP 401. Human bearer tokens are never renewed or replaced by this flow. The backend worker obtains its own fresh service JWT per scan. Missing credentials disable service authentication; there is no default secret. Legacy static tokens remain supported only for older local configurations without service credentials.

First successful service authentication creates only the dedicated account and InventoryAgent role. A transaction lock prevents duplicate provisioning across replicas. Existing accounts are never overwritten: collisions, extra roles, inactive accounts, or password mismatches fail authentication. For rotation, coordinate the account password hash and both services' deployment secret through an authorized administration process; changing only the environment secret will deliberately fail. InventoryAgent cannot approve a recommendation or change stock.

Local backend: run the configuration script and then `dotnet run --project backend/src/AgriOps.Api` in that same PowerShell session. The agent loads the root `.env`. Docker reads the root `.env` on its next deployment. Configuring credentials does not restart services or migrate the database.
