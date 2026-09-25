# Inventory agent verification — 25 September 2026

## Automated checks

Python command from `agents/inventory-agent`:
` .\.venv\Scripts\python.exe -m pytest -q --tb=short `

Result: **16 passed** using real FastAPI, LangGraph and SQLite with a fake model
and backend confined to tests. Coverage includes persisted pause/restart/resume,
approval and rejection, no shortage, incoming quantities, missing/truncated offers,
invalid evidence, bounded invalid-model retries, provider failure sanitization,
lost submission response and idempotent retry, manager ownership isolation,
configuration/input validation and fixed backend routes with separate tokens.

.NET command from the repository root:
`dotnet run --no-restore --project tests/PurchaseRequestChecks`

Result: **11/11 verification groups passed** against the application pipeline and
local PostgreSQL. The added group checks manager access, agent evidence access,
Python decimal-string payload compatibility and stale observation rejection.
Existing authorization, approval, duplicate, concurrency and rollback checks pass.
Incoming quantity after approval is also checked. Temporary records are cleaned
by their generated IDs. No new database migration is needed for the agent context.

`dotnet build --no-restore` passed with zero warnings and errors.
The installed Gemini structured-output adapter was constructed successfully without
a provider request. The tested package versions are in `requirements-lock.txt`.

## Not yet verified

No live Gemini call was made. Real provider credentials, a team-available model,
and real Manager/InventoryAgent identity integration are still required. Synthetic
model responses verify orchestration and permission gates, not recommendation
quality. Historical supplier delivery comparison is not implemented: lead times
are configured estimates. Fulfilment/receipt linkage and frontend review remain
future work. Do not report these checks as a live end-to-end AI demonstration.
