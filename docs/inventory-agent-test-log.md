# Inventory agent verification — 25 September 2026

## Automated checks

Python command from `agents/inventory-agent`:
` .\.venv\Scripts\python.exe -m pytest -q --tb=short `

Result: **27 passed** using real FastAPI, LangGraph and SQLite with a fake model
and backend confined to tests. Coverage includes persisted pause/restart/resume,
approval and rejection, no shortage, incoming quantities, missing/truncated offers,
invalid evidence, bounded invalid-model retries, provider failure sanitization,
lost submission response and idempotent retry, manager ownership isolation,
configuration/input validation and fixed backend routes with separate tokens.

The additional three checks cover the standalone `test_gemini.py` demo: successful
selection and exact sample quantity/cost without a backend token or backend node
calls; rejection of invented suppliers within two attempts; and missing Gemini
configuration failing before any model call. The manual script shares production
selection/validation code and is not executed by pytest. These checks use a fake
model; a real Gemini call still needs local credentials and a valid model ID.

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

Eight further regression cases verify safe classification of wrapped provider
400/403/404/429/500/503 errors, preservation through supplier validation, and
separate schema-failure reporting. No raw provider text is returned in these cases.

## User-run live attempt

The user ran the sample script with `gemini-3.8-flash` on 25 September 2026.
Both attempts returned `model_provider_unavailable` (a structured provider 5xx
classification). No validated selection or backend write occurred. The exact
HTTP status was not captured in this output. This is a failed live attempt,
not a successful end-to-end AI test.

## Successful user-run live sample

The user subsequently supplied successful terminal output for
`gemini-3.5-flash-lite` at `2026-09-25T07:24:52.984140+00:00`: validated sample,
one model attempt, 550 reported tokens, quantity 35 kg, Sample Budget Supplier,
estimated cost 4200.00 and estimated lead time seven days. No backend write.
See [live test evidence](inventory-agent-live-test-evidence.md) for the transcribed
result, provenance, limitations and commands to capture an original transcript.

## Not yet verified

Live sample selection succeeded according to the user-supplied output. Real
Manager/InventoryAgent identity integration is still required for the full backend workflow. Synthetic
model responses verify orchestration and permission gates, not recommendation
quality. Historical supplier delivery comparison is not implemented: lead times
are configured estimates. Fulfilment/receipt linkage and frontend review remain
future work. Do not report these checks as a live end-to-end AI demonstration.
