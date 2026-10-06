# Inventory permissions - 6 October 2026

Implemented against development commit a529e12. This is a local verification record, not proof of a deployed workflow.

## Access matrix

| Action | FarmManager | FarmWorker | Farmer | InventoryAgent |
|---|---|---|---|---|
| Inventory, suppliers and movement history | Yes | Yes | Yes | Read for evidence |
| Create/edit/delete items, suppliers and offers | Yes | No | No | No |
| Receive stock | Yes | No | No | No |
| Use stock | Yes | Yes | No | No |
| Approve/reject recommendations; read purchase requests | Yes | No | No | No |
| Submit agent recommendation | No | No | No | Yes |

Administrator is not implicitly a farm manager. Assign FarmManager explicitly when that responsibility is intended. Service identities cannot obtain manager write access by also carrying a manager role. These are role-level permissions: the current inventory model does not implement per-farm worker assignments or farm ownership filtering.

## Implementation

- API controller policies protect inventory/supplier reads and management writes.
- Transaction actions reject unauthorized movement types before accessing the stock service.
- `/api/inventory/session` returns verified capabilities for UI visibility; the API remains the authority.
- Web inventory uses the shared login session. Workers see usage only; farmers see no movement form.
- Mobile supports username/password login against the shared auth endpoint, stores its token securely, and reuses the shared mobile session. Non-managers do not request recommendation or purchase lists.
- Approval/rejection retains the existing Manager policy, now restricted to FarmManager.
- Registration is Administrator-only to prevent users self-assigning privileged roles.
- JWT issuer, audience and expiry validation are enabled, and the sub claim is preserved. The committed signing key and fallback were removed; configure a private Jwt:Key in local secrets or the deployment environment. Re-login after changing token settings.
- The automatic reset of an existing admin password at startup was removed.

## Existing stock logic preserved

InventoryService, InventoryTransactionService and ReorderRecommendationService were not modified. New stock is zero. Receive/Use transactions lock the inventory row, reject insufficient stock and commit the stock update and history together.

Source review of the decision service confirms a locked recommendation, an early return for an already matching decision, and a purchase request saved atomically with approval. It does not write CurrentStock. Live PostgreSQL concurrency and rollback checks have not been rerun in this merged environment.

## Executed checks

- Backend build: passed; existing Analyticscontroller nullable warnings remain.
- Web production build: passed.
- Database-free backend permission harness: 65 checks passed. Covers role-policy acceptance/denial, denied transaction calls before data access, anonymous access, decision endpoint attributes and protected registration. It does not exercise HTTP JWT middleware or successful database writes.
- Targeted web permission tests: 4 passed (login required, farmer read-only, worker usage-only, manager receipt/edit).
- Existing inventory Flutter suite: 24 passed.
- New Flutter permission tests: 2 passed. Session regression tests rerun alongside them: 6 passed total.
- PostgreSQL service checks: 11 passed on 2026-10-06 in a newly created isolated local database. Verified zero initial stock, receipt 10, usage 3, stock 7, two history records, insufficient-stock rejection with unchanged data, pending recommendation, one purchase request after approval and retry, and no stock/history change on approval. These call the production services directly; they do not test HTTP authorization, browser login or Gemini.

The retained database is `agriops_inventory_checks_f8f5cecd7d854994aeaee15918a6c0ac`. It contains only verification data. The configured application database was not modified.

## Repeat commands

From the repository root:

```powershell
dotnet run --project tests/InventoryPermissionChecks/InventoryPermissionChecks.csproj
```

To repeat the PostgreSQL checks, run in PowerShell from `D:\development2\AgriOps-integrated`:

```powershell
dotnet run --project tests/InventoryDatabaseChecks -- --local-secrets "$env:APPDATA\Microsoft\UserSecrets\2c8507ce-d220-4efb-bb0f-5d21890bba61\secrets.json"
```

This reads credentials privately, permits only a local PostgreSQL host, creates a fresh uniquely named test database and retains it for inspection. It requires database-creation permission. It never runs the API startup seeder or modifies the configured application database. It verifies the current EF model, not migration history.

From frontend-web:

```powershell
npm test -- src/__tests__/inventoryPermissions.test.jsx
npm run build
```

From mobile:

```powershell
flutter test test/api_test.dart test/app_test.dart test/workspace_test.dart test/inventory_views_test.dart test/inventory_permissions_test.dart
```

## Pending live evidence

Use a reviewed, disposable integration database and valid private JWT configuration. Do not run the existing shared-database test factory against valuable data.

1. Log in separately as FarmManager, FarmWorker and Farmer; capture permitted actions and denied API calls.
2. Create an item: stock must start at zero. Receive 10 as manager, use 3 as worker, verify stock 7 and two movement records.
3. Attempt worker receipt and farmer usage; confirm 403 and unchanged stock/history. Attempt usage 8; confirm rejection and stock 7.
4. Generate a recommendation from actual inventory evidence. Approve as manager and repeat approval: confirm exactly one purchase request and unchanged stock. Test rejection, stale evidence and transaction rollback.
5. Open the same item on mobile via QR and capture permitted actions for each role.
6. Record results and screenshots honestly; mock tests and source inspection do not establish that the live workflow passed.

Database writes were limited to the new isolated verification database. No application migrations, commits or pushes were performed.
