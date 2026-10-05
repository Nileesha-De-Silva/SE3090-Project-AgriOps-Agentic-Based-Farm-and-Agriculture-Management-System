# Purchase-request verification

## Current workflow: recommendation approval — 25 September 2026

The earlier purchase-request-first API below has been replaced to match the project
requirement. A human manager decides a durable AI recommendation; approval alone
creates its purchase request. Direct purchase creation and purchase decision routes
are removed. Earlier results below are historical, not a description of current API.

Run `dotnet run --no-restore --project tests/PurchaseRequestChecks` after applying
`AddReorderRecommendations`. The fixture uses the real API pipeline and PostgreSQL
with ephemeral JWTs in the test host only. It does not invoke an LLM; proposal model
names explicitly identify synthetic test data.

| ID | Current verification group | Result |
|---|---|---|
| REC-001 | Agent proposal authorization; invalid quantities/IDs/reasons; missing/unavailable/unlinked suppliers | PASS |
| REC-002 | Pending recommendation creates no purchase; accurate review snapshot; retry deduplication; one pending proposal per item; new app instance reads persisted proposal | PASS |
| REC-003 | Recommendation alone prevents parent deletion and inventory unit change | PASS |
| REC-004 | Anonymous, worker, agent, expired/wrong-issuer/wrong-audience/wrong-signature tokens cannot approve | PASS |
| REC-005 | Manager approval creates exactly one matching request; repeats return same purchase ID; manager issuer, subject, time and note recorded | PASS |
| REC-006 | Rejection and repeat rejection create no purchase; opposite decision blocked | PASS |
| REC-007 | Changed supplier price or stock blocks stale approval | PASS |
| REC-008 | Concurrent approvals create one purchase; concurrent opposite decisions have one winner | PASS |
| REC-009 | Injected failure after purchase SQL, before commit, leaves recommendation Pending and creates no purchase | PASS |
| REC-010 | Direct purchase creation/approval routes unavailable; missing recommendation 404; stock/history unchanged | PASS |

| REC-011 | Manager access, role-protected agent context, Python decimal strings and stale observation rejection | PASS |

Final result: **11/11 verification groups passed**. No LLM was called.

The additive migration was applied to the local development database. Temporary
test records are removed by run-specific IDs. No existing user records were deleted
or converted. Actual agent output quality, team-issued tokens, UI review flow,
catalogue-update concurrency and fulfilment/netting remain to be verified.

## Historical results before the workflow correction

This checkpoint includes pending requests and JWT-protected manager decisions.
Production identity-provider integration still requires team authority, audience
and role-claim settings. Tests use an ephemeral signing key only in the test host.

## Checks

`dotnet run --project tests/PurchaseRequestChecks` exercises the real PostgreSQL
service using temporary fixtures. It checks:

- An available supplier-item link is required.
- Negative, zero, over-limit and excess-precision quantities are rejected.
- Whitespace-only reasons and empty IDs are rejected.
- A nonexistent supplier is rejected, with no rejected request persisted.
- Successful creation persists Pending status, null ApprovedAt and trimmed reason.
- List and lookup return the created request; missing lookup returns null.
- Inventory stock and movement history remain unchanged.
- A purchase request alone prevents supplier and inventory-item deletion.

## Results — 25 September 2026

Ran `dotnet run --project tests/PurchaseRequestChecks -- http://127.0.0.1:5289`.

| ID | Check | Result |
|---|---|---|
| PR-001 | Valid service creation, Pending status, null approval timestamp and trimmed reason | PASS |
| PR-002 | Service list, lookup and missing request | PASS |
| PR-003 | Invalid quantities, empty ID and blank reason rejected; no rejected requests persisted | PASS |
| PR-004 | Unlinked/unavailable supplier rejected; nonexistent supplier rejected | PASS |
| PR-005 | Request creation leaves stock and transaction history unchanged | PASS |
| PR-006 | Purchase request alone prevents supplier and inventory-item deletion | PASS |
| PR-007 | HTTP POST 201, Location header lookup 200 and list membership | PASS |
| PR-008 | HTTP empty body fields and excess precision return 400 | PASS |
| PR-009 | HTTP missing request/supplier returns 404; unavailable supplier returns 409 | PASS |

All fixtures were removed after each run. Concurrent catalogue changes are not
tested by the original creation checks; decision concurrency is covered below.

The first database run found an EF Core Relational dependency mismatch. Added an
explicit 10.0.12 reference matching the API's EF Core version; subsequent checks
passed. The API was launched with EventLog logging disabled for the test process
to avoid the known local Windows logging-permission issue.

## Manager-decision checks — 25 September 2026

Ran `dotnet run --no-restore --project tests/PurchaseRequestChecks` using the real
application pipeline through WebApplicationFactory and the development database.
The test host alone trusts a fresh in-memory signing key. No test login endpoint,
signing key or authentication bypass is added to the running API.

| ID | Check | Result |
|---|---|---|
| PR-010 | Anonymous approval returns 401; Worker role returns 403 | PASS |
| PR-011 | Expired, wrong-issuer, wrong-audience and wrong-signature JWTs return 401 | PASS |
| PR-012 | Failed authorization leaves request Pending | PASS |
| PR-013 | Manager approval persists Approved and ApprovedAt | PASS |
| PR-014 | Manager rejection persists Rejected with null ApprovedAt | PASS |
| PR-015 | Repeat approval and opposite decisions on final states return 409 | PASS |
| PR-016 | Manager decision on nonexistent request returns 404 | PASS |
| PR-017 | Concurrent approve/reject yields one 200 and one 409 | PASS |
| PR-018 | Decisions leave stock and movement history unchanged | PASS |

Original service checks also passed. Temporary test records were removed.
Real identity-provider discovery/key rotation and live team-issued tokens remain
unverified until provider settings are supplied. Decision actor auditing is not
supported by the existing schema.
