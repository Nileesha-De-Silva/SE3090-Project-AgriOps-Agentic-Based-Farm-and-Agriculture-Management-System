# Inventory editing — manual verification

Added on 27 September 2026. The user supplied passing lint, all 13 tests and build
output for this version. Decimal-input and demand-planning changes made afterward
still need fresh verification; see `demand-planning-test-log.md`.

From the repository root:

```powershell
cd web
npm run lint
npm test
npm run build
```

Expected automated suite: 13 tests, including three new inventory-edit cases.

In the running browser demo:

1. Open Inventory and choose **Edit item** on Organic fertilizer.
2. Confirm the fields are prefilled, the unit is disabled and stock is not editable.
3. Change its name and valuation, save, and check the inventory row. Supplier
   prices in Supplier offers should remain unchanged. The renamed item should
   also appear in the supplier's read-only Supplies list.
4. Change minimum stock from 20 to 25. Try approving its pending recommendation;
   the changed snapshot should block approval. Rejection should still work.
5. Add a new item with **Link registered suppliers after saving** unchecked.
   With zero stock and no references, its unit should be editable. Once it has
   a stock movement or supplier offer, its unit should be locked.
6. Cancel an edit and confirm it does not save changes. Blank names, negative
   amounts and more than two decimal places should be rejected.

This remains an in-memory demo. Refresh resets edits; real API persistence and
authentication remain deferred. Inventory deletion is not part of this change.
