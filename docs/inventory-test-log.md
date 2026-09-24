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


| INV-003 | Create inventory item | POST /api/inventory with valid fertilizer details | HTTP 201, generated ID, currentStock 0 | HTTP 201; ID 9c6d4165-6b38-41d4-9659-370842936981; currentStock 0 | PASS |
| INV-004 | Retrieve created item | GET /api/inventory/9c6d4165-6b38-41d4-9659-370842936981 | HTTP 200 with the matching item | HTTP 200; matching ID; Organic Fertilizer; unit kg; minimum stock 20; unit cost 150 | PASS |
| INV-005 | List inventory after creation | GET /api/inventory | HTTP 200; list includes the created item ID | HTTP 200 with inventory records; specific created ID still needs confirmation in the full list | PARTIAL |
| INV-006 | Reject negative cost | POST /api/inventory with unitCost -1; other fields valid | HTTP 400; no item created | Result not recorded | NOT RECORDED |
| INV-007 | Reject excess decimal places | POST /api/inventory with unitCost 150.123; other fields valid | HTTP 400; no item created | Result not recorded | NOT RECORDED |


| INV-008 | Update inventory details | PUT /api/inventory/9c6d4165-6b38-41d4-9659-370842936981 with minimumStockLevel 25 and unitCost 160 | HTTP 200; updated values; stock unchanged | HTTP 200; minimum stock 25; cost 160; stock 0 | PASS |
| INV-009 | Verify update persisted | GET /api/inventory/9c6d4165-6b38-41d4-9659-370842936981 | HTTP 200 with saved values | HTTP 200; minimum stock 25; cost 160; stock 0 | PASS |
| INV-010 | Delete unused test item | DELETE /api/inventory/1265cf75-9cec-4d4c-9461-10b2f1d9b0e2 | HTTP 204 with no response body | HTTP 204; no response body | PASS |
| INV-011 | Retrieve deleted item | GET /api/inventory/1265cf75-9cec-4d4c-9461-10b2f1d9b0e2 | HTTP 404 with item-not-found message | HTTP 404; Inventory item not found. | PASS |
| INV-012 | Repeat deletion | DELETE /api/inventory/1265cf75-9cec-4d4c-9461-10b2f1d9b0e2 | HTTP 404 with item-not-found message | HTTP 404; Inventory item not found. | PASS |
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

## Inventory creation and retrieval — 23 September 2026

### Code tested
Based on commit eac5273, with uncommitted inventory creation changes.

### Creation request

POST /api/inventory

{
  "name": "Organic Fertilizer",
  "category": "Fertilizer",
  "unitOfMeasurement": "kg",
  "minimumStockLevel": 20,
  "unitCost": 150
}

### Confirmed results

- Creation returned HTTP 201.
- Generated item ID: 9c6d4165-6b38-41d4-9659-370842936981.
- Initial currentStock was 0.
- Retrieving that ID returned HTTP 200 with matching item details.
- Listing inventory returned HTTP 200 with multiple records.

### Observations

- Swagger displayed the successful 201 response as "Undocumented".
- Multiple fertilizer records were visible following repeated creation tests.
- An earlier successful creation returned ID 23d80919-307a-40ab-bbdd-45676bc4f0ad.

### Remaining verification

- Confirm the created item ID appears in the full inventory list.
- Record the negative-cost request's actual response.
- Record the excess-decimal request's actual response.
- Confirm invalid requests do not create additional records.