# Supplier management test log

Supplier APIs use the existing database schema; no migration is required.
Mark PASS only after executing the test and recording the result.

| ID | Test | Expected result | Actual result | Status |
|---|---|---|---|---|
| SUP-001 | POST /api/suppliers with a valid name and contact details | 201, generated ID, trimmed details, Location header | Pending | NOT RECORDED |
| SUP-002 | GET /api/suppliers and GET /api/suppliers/{id} | 200; created supplier appears with matching details | Pending | NOT RECORDED |
| SUP-003 | POST blank or whitespace-only name | 400; no supplier created | Pending | NOT RECORDED |
| SUP-004 | POST invalid email or name longer than 100 characters | 400; no supplier created | Pending | NOT RECORDED |
| SUP-005 | PUT existing supplier with changed contact details | 200; values persisted; ID and CreatedAt unchanged | Pending | NOT RECORDED |
| SUP-006 | GET/PUT/DELETE nonexistent supplier ID | 404; Supplier not found. | Pending | NOT RECORDED |
| SUP-007 | DELETE unused supplier, then GET its ID | 204, then 404 | Pending | NOT RECORDED |
| SUP-008 | DELETE supplier with linked items or purchase requests | 409; supplier and relationships remain | Linked-item case returned 409; link remained retrievable. Purchase-request case untested | PARTIAL |

## Example create request

POST `/api/suppliers`

```json
{
  "name": "Test Agricultural Supplies",
  "contactPerson": "Test Contact",
  "phone": "0771234567",
  "email": "supplier@example.com",
  "address": "Test address"
}
```

Copy the returned ID for GET, PUT and DELETE tests. PUT replaces the contact
details; omitted optional fields are cleared. Optional fields may be null.

## Automated HTTP verification — 25 September 2026

- SUP-001: PASS — 201, Location header and trimmed name verified.
- SUP-002: PARTIAL — list returned 200; GET by ID matched the created supplier. List membership was not asserted.
- SUP-003: PARTIAL — whitespace-only name returned 400; absence of a database record was not independently checked.
- SUP-004: PARTIAL — invalid email returned 400; overlength name remains untested.
- SUP-005: PASS — updated details persisted, omitted email cleared, and persisted CreatedAt was unchanged.
- SUP-006: PASS — GET, PUT and DELETE of the deleted test ID each returned 404.
- SUP-007: PASS — deletion returned 204; subsequent GET returned 404.
- SUP-008: PARTIAL — subsequent supplier-item verification confirmed linked-item deletion protection; purchase-request case remains untested.

## Supplier-item verification — 25 September 2026

Executed `scripts/test-supplier-items.ps1` against the local PostgreSQL-backed API.

| ID | Test | Actual result | Status |
|---|---|---|---|
| SPI-001 | Empty catalogue, link creation, list membership and lookup | Empty list; POST 201; list and GET contained matching IDs | PASS |
| SPI-002 | Duplicate supplier-item pair | 409 | PASS |
| SPI-003 | Invalid price, precision, range, negative lead time and missing required fields | All returned 400; stored price and lead time remained unchanged | PASS |
| SPI-004 | Update price, lead time and availability | Zero price and zero days accepted; false availability persisted; CreatedAt unchanged | PASS |
| SPI-005 | Delete linked supplier or inventory item | Both returned 409; link remained retrievable | PASS |
| SPI-006 | Missing supplier and inventory item | 404 | PASS |
| SPI-007 | Remove link; then GET, PUT and DELETE it again | 204 followed by 404 for all three methods | PASS |

Temporary supplier, inventory item and link were removed after the test.
Concurrent duplicate creation and concurrent deletion were not tested.
- Both temporary verification suppliers were deleted successfully.
- An initial timestamp assertion compared the immediate create response with a database round trip and failed. The follow-up compared persisted values before and after update and passed; PostgreSQL timestamp precision differs from .NET tick precision.
- API launched with EventLog logging disabled for this run to avoid the local logging-permission error; no logging configuration file was changed.
- Build passed with zero warnings and zero errors.
