# Component 3 mobile update — 2026-09-30

Scope: only inventory mobile UI and tests. No authentication, backend, farm/crop
screens, shared app entry points, dependency files or teammate tests changed.

- Supplier contacts: search by supplier, person, phone, email or address; explicit
  missing values; individual copy actions with success/failure feedback.
- Activity: separate recommendation/purchase views, status filters, newest-first
  dates, supplier names, reasons, manager notes and copyable reference IDs.
- Recommendation price and delivery details use saved proposal values. Purchase
  units use the linked recommendation snapshot; unavailable units are labelled.
- Offer editing remains in web Inventory. No duplicate inventory editor was added
  to Supplier contacts. Approval remains in the web workflow.

## User-run checks (not run by Codex)

From the cloned project's mobile folder:

```powershell
flutter test test/inventory_views_test.dart test/api_test.dart test/app_test.dart test/workspace_test.dart
```

The three new widget checks use synthetic fixtures, not live records. They cover
contact search/missing details, copy action and decision filters/snapshot units.
Manual checks: narrow screen, long contact names, text scaling, clipboard denial,
empty lists and switching filters after a server refresh.

Known merged-project issues outside this change: `test/widget_test.dart` expects
a Farms app constructor that does not match the current required Workspace;
`analysis_options.yaml` references flutter_lints absent from pubspec.yaml. These
shared/component-1 files were deliberately left unchanged. Full-suite analysis
and live execution remain pending the team's integration fixes. Authentication
still uses the existing development-token entry; this change does not bypass it.

## Inventory layout and validation follow-up

- Inventory cards wrap names and show available stock, minimum stock and units separately.
- Movement quantities show the item unit, explain Use/Receive and reject usage above the displayed available stock before sending a request. Backend validation remains authoritative.
- Quantity and notes inputs are disabled while writes are unavailable or after submission.
- Stock history uses readable local dates; agent demand settings explain the optional weekly estimate.
- User confirmed the previous 17 targeted tests passed and the Android debug APK built and launched on emulator-5554. Live authenticated inventory and camera checks remain pending.
- Added a widget regression check for excess usage without a backend write. Re-run the targeted command above after this update; this new check has not been run by Codex.

## Agent recommendation display
- Ask Agent now displays item/supplier names, proposal quantity and units, saved unit price and estimated total, delivery estimate, reason, review status and reference.
- Missing numeric values are shown as not recorded rather than zero. Catalogue valuation and current units never replace proposal snapshots.
- Pending review and approved purchase states explain that approval does not receive stock.
- Two widget checks added for proposal values and missing fields; execution is pending the user's test run.
- User reported 18 tests passing before the Activity search and recommendation display updates. The latest emulator screenshot confirms app launch, not live backend authentication.

## QR scanning workflow
- Camera starts on request and can be stopped; manual ID or label text entry remains available.
- Scanner returns only an ID from the currently loaded inventory. Unknown items remain on screen with refresh guidance; arbitrary URLs and invalid text are rejected.
- Multiple detected labels prefer a known item. A successful match returns once and opens the item through the existing navigation; scanning itself never writes stock.
- Added widget checks for invalid/unknown/known manual labels and empty inventory. These do not test physical camera decoding.
- Pending user verification: run the targeted Flutter tests, allow/deny camera permission, scan a real item label, test an unknown label, background/resume the camera, and verify Use/Receive only writes on explicit submission.
- Live item lookup still needs the shared backend authentication restored. QR label generation requires the separately requested package decision.

## QR labels
- Added qr_flutter ^4.1.0 as the only direct dependency for local QR rendering, with user authorization. Existing dependencies and teammates' feature files are preserved.
- Item details now offer Show QR label. The label includes the item name and a QR payload containing only agriops:item:<inventory UUID>, without quantities, prices, tokens or contact details.
- Labels can be captured as screenshots for printing/display on another device; this is not a native export or printing integration. Copy label text is also available.
- Invalid IDs cannot generate a label. Two widget checks cover the generated payload/clipboard and invalid IDs. These do not independently verify camera decoding.
- User must run flutter pub get, the targeted tests, and restart the app. No dependency installation, build or test was run by Codex.
- Physical scan and live authenticated lookup remain pending. The previous package-approval limitation is resolved; backend authentication remains a separate blocker.
