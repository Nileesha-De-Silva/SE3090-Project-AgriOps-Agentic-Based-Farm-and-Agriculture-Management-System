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
The caller supplies target stock explicitly; minimum stock is only the trigger.
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

## Request and review

Example assumes `$managerToken` already contains a valid team-issued token and
`$itemId` identifies an existing low-stock item with available supplier offers:

```powershell
$headers = @{ Authorization = "Bearer $managerToken" }
$runId = [guid]::NewGuid().ToString()
$body = @{ request_id = $runId; inventory_item_id = $itemId; target_stock = 50 } | ConvertTo-Json
$result = Invoke-RestMethod http://localhost:8003/recommend -Method Post -Headers $headers -ContentType application/json -Body $body
$result
```

Reuse the request ID and identical input on retries. Inspect `evidence`, `trace`,
`quantity` and `recommendation`; `awaiting_approval` means the backend saved a
Pending proposal. A different input with the same request ID returns 409.

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
