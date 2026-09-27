# Demand-based reorder planning — 27 September 2026

Status: automated verification passed, based on terminal output supplied by the
user on 27 September 2026. These commands were run by the user, not by Codex.

- Backend: 14/14 groups passed; generated test records were removed by the harness.
- Python: 34 tests passed in 2.39 seconds, using controlled model/backend doubles.
- Frontend lint: passed with no findings.
- Frontend tests: 19/19 passed, zero failures.
- Frontend production build: passed in 200 ms, 23 modules transformed.

No live Gemini demand test or completed browser walkthrough was reported.
No commit or push is recorded for this change here.

## Rules

- Read Use movements within the last 28 days, including the window start and
  excluding future transactions. Receive movements are not demand.
- Average weekly usage = total / 4. Average daily usage = total / 28.
- Use history if the item existed for 28 days and total usage is positive.
  Otherwise require a positive manager weekly estimate and divide it by seven.
  Item age is a coverage proxy, not proof of complete recording.
- Monthly demand = daily usage × 30.
- Safety stock = daily usage × safety days (default 7, configurable 0–90).
- For each available supplier, reorder point = max(configured minimum,
  daily usage × (delivery days + safety days)).
- Target = max(configured minimum, daily usage × (max(30, delivery days) + safety days)).
- Quantity = max(0, target − current stock − Pending/Approved incoming quantity).
- Reorder when current stock <= reorder point and quantity > 0. Round calculated
  stock thresholds/targets upward to two decimal places; do not round daily rate
  before calculating them. Reject targets above the storage limit.
- Flag shortage risk when current stock < daily usage × delivery days. Outstanding
  orders have no confirmed arrival dates and cannot remove this warning.
- The Python agent prefers eligible offers without this risk when any exist;
  a manager can explicitly compare warned offers in the browser demo.

Example: 56 kg used in 28 days gives 14/week and 60/30 days. With seven delivery
days and seven safety days, reorder point is 28 and target is 74. Stock 28 plus
10 incoming means a 36 kg proposal, even though the configured minimum is 20.

## Implementation and boundaries

Inventory → Plan reorder shows source, usage, safety stock and supplier-specific
calculations. The browser creates a deterministic demo proposal, not live Gemini
output. Refresh resets demo data. The initial fixtures have no usage history;
enter a weekly estimate to try the feature immediately.

The agent `/recommend` uses demand mode when `target_stock` is omitted. Supply
`weekly_estimate` when history is short/missing and optional `safety_days`.
Explicit `target_stock` preserves the prior manual-target behavior. The existing
`test_gemini.py` still tests that legacy sample; it does not validate live demand.

The backend exposes 28-day usage, coverage and an evidence timestamp, recalculates
the proposed amount using stored data, and saves an immutable demand snapshot.
`20260927040000_AddDemandSnapshots` adds one nullable text column; existing
recommendations keep their previous behavior. Manager approval rechecks usage,
incoming orders, stock and supplier evidence. It creates one purchase atomically
and leaves stock unchanged. Rejection creates no purchase. AI cannot approve.

The graph, structured outputs, bounded model retries and human interrupt continue
to follow the course references documented in `agent-reference-plan.md`.
No auth rules were removed. Team authentication and live frontend integration
remain deferred. Analysis is on demand, not a scheduled background monitor.
Purchase fulfilment remains unlinked: old Approved requests still count as
incoming until that lifecycle is implemented. This can suppress further ordering
after a generic receipt; the current demo is not ready for unattended ordering.

## Run manually

From the repository root, frontend:

```powershell
cd web
npm run lint
npm test
npm run build
cd ..
```

Frontend result: 19/19 passed, including six demand tests (user-supplied output).

Backend (stop any running API first if its binaries are locked):

```powershell
cd backend/AgriOpsAI.Api
dotnet build
dotnet ef database update
cd ../..
dotnet run --project tests/PurchaseRequestChecks
```

The migration is already included; do not create another migration with the same
name. The test harness uses the configured local PostgreSQL database and deletes
only its generated test records. Backend result: 14/14 groups passed (user-supplied
output). The successful harness run also checked that no migrations were pending;
the separate migration command output was not supplied.

Offline Python checks, from the repository root:

```powershell
cd agents/inventory-agent
.\.venv\Scripts\python.exe -m pytest tests -q -p no:cacheprovider
cd ../..
```

New cases cover demand arithmetic, short history, rounding, incoming coverage,
missing evidence, persistence, changed retry input and unsafe supplier choices.
These use controlled model/backend doubles, not Gemini. Result: 34 passed in
2.39 seconds (user-supplied output).

## Browser walkthrough

Pending manual confirmation; automated passes do not establish browser behavior.

UI clarity update: weekly usage now has a short fallback explanation, the stock
buffer sits in an expandable section, and supplier cards highlight the amount
to order and estimated total. Calculation details are collapsed by default.
Existing calculations and approval rules are unchanged. The recorded automated
passes above precede this UI-only update; fresh lint/build and browser checks are
pending. The calculate button is now labelled **Calculate order amount**.

1. Open Inventory → Paddy seeds → Plan reorder. Its current stock is 42, minimum
   is 25 and supplier delivery estimate is four days.
2. Enter weekly usage **28** and keep seven safety days. Calculate: monthly usage
   120, safety stock 28, reorder point 44, target 148, quantity 106.
3. Create a demo recommendation. It appears Pending with its calculation reason.
   Attempting another for the same item must be blocked until it is decided.
4. Approve it. One 106 kg request appears; stock remains 42. Calculate again:
   incoming 106 covers the target, so no second order is needed.
5. Reset the demo, create the same proposal, then record a stock movement or
   change supplier price. Approval must fail; rejection remains available.
6. Try a new/unused item without a weekly estimate, an unavailable supplier and
   a very large weekly estimate. No unsupported recommendation should be saved.
7. Check mobile dialog scrolling and confirm the calculation remains readable.

Automated tests additionally check recorded history, date filtering, long lead
times, changed usage/incoming totals, rounding and duplicate decisions.
