# Inventory Management — Manual Test Log

Mark PASS only when the actual result matches the expected result. Preserve earlier results and record corrections when later evidence changes the interpretation.

## Test environment

- Branch: `feature/dinali/agent-3-component-3`
- Backend: .NET 10
- EF Core: 10.0.12
- Database: local PostgreSQL — `agriopsai_db`
- API address: `http://localhost:5289`
- Testing tool: Swagger UI
- Latest confirmed pushed commit: `d1b90a7`
- Transaction-history endpoint tested with subsequent uncommitted changes.

## Test item references

| Reference | Item ID | Purpose |
|---|---|---|
| Fertilizer | `9c6d4165-6b38-41d4-9659-370842936981` | Creation, updates and maximum-stock tests |
| Delete test | `1265cf75-9cec-4d4c-9461-10b2f1d9b0e2` | Created and deleted during testing |
| Stock test | `e527020a-3fd5-44c8-bfa6-30048e594e04` | Receipts, usage and transaction history |

## Inventory item tests

| ID | Test | Expected result | Actual result | Status |
|---|---|---|---|---|
| INV-001 | GET inventory when empty | HTTP 200 with `[]` | Original log incorrectly recorded HTTP 404 as PASS; original result needs confirmation | NEEDS CONFIRMATION |
| INV-002 | GET nonexistent item `11111111-1111-1111-1111-111111111111` | HTTP 404 with item-not-found message | Expected result confirmed by tester | PASS |
| INV-003 | POST valid fertilizer details | HTTP 201; generated ID; stock 0 | HTTP 201; fertilizer ID generated; stock 0 | PASS |
| INV-004 | GET created fertilizer | HTTP 200 with matching details | Matching ID; Organic Fertilizer; kg; minimum stock 20; unit cost 150 | PASS |
| INV-005 | GET inventory after creation | HTTP 200; created item included | HTTP 200; full response contained the fertilizer ID | PASS |
| INV-006 | POST with unitCost -1 | HTTP 400; no item created | Detailed result and absence of new records not recorded | NOT RECORDED |
| INV-007 | POST with unitCost 150.123 | HTTP 400; no item created | Detailed result and absence of new records not recorded | NOT RECORDED |
| INV-008 | PUT fertilizer minimum stock 25 and cost 160 | HTTP 200; values updated; stock unchanged | HTTP 200; minimum stock 25; cost 160; stock 0 | PASS |
| INV-009 | GET fertilizer after update | Saved values returned | HTTP 200; minimum stock 25; cost 160; stock 0 at that time | PASS |
| INV-010 | DELETE unused delete-test item | HTTP 204; empty body | HTTP 204; empty body | PASS |
| INV-011 | GET deleted item | HTTP 404 | HTTP 404; “Inventory item not found.” | PASS |
| INV-012 | DELETE same item again | HTTP 404 | HTTP 404; “Inventory item not found.” | PASS |

## Stock movement and history tests

Stock changes use POST `/api/inventory/{inventoryItemId}/transactions`.
History uses GET on the same route.

| ID | Test | Expected result | Actual result | Status |
|---|---|---|---|---|
| INV-013 | Receive 100 for stock-test item starting at 0 | HTTP 201; stock 100 | Tester reported expected response and stock; history contains Receive 100 | PASS |
| INV-014 | Use 20 after receipt | HTTP 201; stock 80 after one usage | Tester initially reported stock 80; later history showed two separate Use 20 submissions and final stock 60 | PASS — REPEATED SUBMISSION NOTED |
| INV-015 | Reject Use 100 when insufficient stock remains | HTTP 409; stock and history unchanged | Tester reported expected rejection; exact before/after state needs a controlled retest because usage was submitted twice | RETEST |
| INV-016 | Receive 99999999.99 for fertilizer starting at 0 | HTTP 201; stock reaches 99999999.99 | HTTP 201; subsequent GET showed stock 99999999.99 | PASS |
| INV-017 | Receive another 0.01 at maximum stock | HTTP 409; stock and history unchanged | HTTP 409 with stock-limit message; supplied GET screenshot preceded rejection, so post-request state remains unverified | PARTIAL |
| INV-018 | GET history for stock-test item | HTTP 200; recorded movements newest first | HTTP 200; visible entries were Use 20, Use 20, Receive 100 in descending time order | PASS |
| INV-019 | Check stock against recorded movements | 100 − 20 − 20 = 60 | GET returned currentStock 60 | PASS |


| INV-020 | Retrieve an existing transaction by ID | HTTP 200 with matching transaction | Confirmed manually by tester in prior task; exact tested ID not recorded | PASS |
| INV-021 | Retrieve nonexistent transaction 11111111-1111-1111-1111-111111111111 | HTTP 404; Inventory transaction not found. | Not yet verified | NOT RECORDED |
| INV-022 | GET /api/inventory/low-stock (basic response) | HTTP 200 with low-stock items | User screenshot shows HTTP 200 and two Organic Fertilizer items, each currentStock 0 and minimumStockLevel 20; response header dated 24 September 2026 | PASS |
| INV-023 | Low-stock threshold boundaries | Below minimum included; equal/above minimum excluded; no matches returns [] | Not yet verified | NOT RECORDED |

## Execution notes and corrections

### Inventory tests — 23–24 September 2026

- Valid item creation returned HTTP 201.
- Repeated creation requests generated separate fertilizer records with different IDs.
- Duplicate-product prevention remains a future enhancement.
- Updating fertilizer details preserved its stock quantity.
- Deleting an unused test item returned HTTP 204.
- Subsequent GET and DELETE requests for that item returned HTTP 404.
- “Undocumented” beside a status in Swagger indicates missing response documentation, not a failed operation.

### Stock tests — 24 September 2026

- Initial stock-receipt testing returned HTTP 500 because the SQL query used the misspelled table name `"InventotyItems"`.
- Correcting the name to `"InventoryItems"` allowed receipt creation.
- The fertilizer receipt used 99999999.99 rather than the intended 100. This became a maximum-stock test.
- A further receipt of 0.01 returned HTTP 409 with:
  `"Receiving this quantity would exceed the stock limit."`
- The stock-test item recorded:
  - Receive 100 at `2026-09-24T09:18:23.758025Z`.
  - Use 20 at `2026-09-24T09:18:47.320289Z`.
  - Use 20 at `2026-09-24T09:19:03.291027Z`.
- GET subsequently confirmed stock 60.
- The earlier reported balance of 80 represents the expected balance after one usage, not the final state after both submissions.
- Two successful submissions are treated as two movements. Request-retry protection has not been implemented.
- Transaction timestamps listed above are UTC.

## Remaining verification

- [ ] Confirm the original empty-list result for INV-001 without deleting current data.
- [ ] Record negative-cost and excess-decimal item-creation results.
- [ ] Verify rejected item-creation requests add no records.
- [ ] Retest Use 100 with confirmed stock 60; compare stock and history before and after.
- [ ] Verify stock and history remain unchanged after the maximum-stock rejection.
- [ ] Test history for an existing item without transactions: expect HTTP 200 with `[]`.
- [ ] Test history for a nonexistent item: expect HTTP 404.
- [ ] Test invalid movement type, missing quantity, zero/negative quantity and excess decimal places.
- [ ] Test deletion protection for items with stock and related records.
- [ ] Test unit-change protection for items with stock and related records.
- [ ] Test simultaneous usage requests to verify stock cannot become negative.

## Startup observations

- Application started successfully at `http://localhost:5289`.
- The HTTP launch profile produced the warning:
  `"Failed to determine the https port for redirect."`
- Local HTTP endpoint testing continued successfully.

## Template for future test runs

- Date and time, including timezone:
- Test ID:
- Commit tested and uncommitted changes:
- Item ID:
- Starting stock and relevant history:
- Request method, URL and body:
- Actual HTTP status and response:
- Stock and history after the request:
- Result: PASS / FAIL / PARTIAL:
- Evidence or screenshot reference:
- Notes:
