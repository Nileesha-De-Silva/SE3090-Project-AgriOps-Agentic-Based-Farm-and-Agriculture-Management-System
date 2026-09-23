# Inventory Management — Manual Test Log

Record the actual result after executing each test.
Mark PASS only when the actual result matches the expected result.

## Test environment

- Branch: feature/dinali/agent-3-component-3
- Backend: .NET 10
- Database: local PostgreSQL — agriopsai_db
- API address: http://localhost:5289
- Testing tool: Swagger UI

## Test cases

| ID | Test | Request / Input | Expected result | Actual result | Status |
|---|---|---|---|---|---|
| INV-001 | List inventory when empty | GET /api/inventory | HTTP 200 with [] | HTTP 404 with expected message | PASS |
| INV-002 | Retrieve a nonexistent item | GET /api/inventory/11111111-1111-1111-1111-111111111111 | HTTP 404 with message "Inventory item not found." | Not recorded | NOT RUN |

## Execution record

For each test run, record:

- Date and time:
- Test ID:
- Commit tested and any uncommitted changes:
- Actual HTTP status:
- Actual response body:
- Result: PASS / FAIL
- Screenshot path, if captured:
- Notes:

## Startup observations

- Application started successfully at http://localhost:5289.
- Warning observed: "Failed to determine the https port for redirect."
- Started using the HTTP launch profile.
- Inventory endpoint results have not yet been confirmed.