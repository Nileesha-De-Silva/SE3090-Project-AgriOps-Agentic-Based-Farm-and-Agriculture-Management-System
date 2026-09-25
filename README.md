# AgriOpsAI – Component 3

## Inventory & Agricultural Resources

**Responsible Member:** IT24103140 - Nawarathna N.H.D.S

### Component Overview

This component is responsible for managing agricultural resources required for farm operations.

### Main Features

- Manage inventory items
- Track current stock levels
- Record resource consumption
- Record restocking transactions
- Manage suppliers
- Detect low-stock items
- Manage purchase requests
- Generate AI-based reorder recommendations
- Support manager approval/rejection of AI recommendations

### Low-stock API

`GET /api/inventory/low-stock` returns inventory items whose current stock
is strictly below their minimum stock level. Items at the minimum are excluded.
Results are ordered by shortage quantity descending, then name and ID.
No matches returns HTTP 200 with `[]`. The response uses the existing inventory
item fields and does not change stock or create purchase requests.
No database migration is required.

### Supplier API

- `GET /api/suppliers`: list suppliers by name and ID.
- `GET /api/suppliers/{id}`: retrieve one supplier (404 if missing).
- `POST /api/suppliers`: create a supplier (201 with a Location header).
- `PUT /api/suppliers/{id}`: replace supplier details (200 or 404).
- `DELETE /api/suppliers/{id}`: delete an unused supplier (204); linked items
  or purchase requests prevent deletion (409).

Name is required. Contact person, phone, email and address are optional.
Field lengths follow the existing schema; email format is validated.
See `docs/supplier-test-log.md` for the manual verification checklist.
### Supplier-item API

Use `/api/suppliers/{supplierId}/items` to list a supplier's linked items.
Use `/api/suppliers/{supplierId}/items/{inventoryItemId}` with GET, POST,
PUT or DELETE to retrieve, create, update or remove a link.

POST and PUT require all three fields:

```json
{ "unitPrice": 12.50, "leadTimeDays": 3, "isAvailable": true }
```

Price must be between 0 and 99999999.99 with at most two decimal places.
Lead time is a nonnegative whole number of days. A duplicate link returns 409;
missing resources return 404. An existing supplier without links returns `[]`.
Unavailable links remain visible so their details can be maintained.
DELETE removes the link only; supplier and inventory records remain unchanged.
No database migration is required.

Run `pwsh -File scripts/test-supplier-items.ps1` with the local API running to
verify the feature. The script creates and removes temporary test records.
Purchase-request management is the next development step.

### Agentic AI Contribution

The Resource / Inventory Agent analyzes low-stock situations and farm requirements to recommend:

- Which item should be reordered
- Recommended reorder quantity
- Suitable supplier
- Reason for the recommendation

High-impact actions such as creating a purchase request require manager approval.
