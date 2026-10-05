# Mobile inventory and backend agent gateway checks

Date: 2026-09-27. All checks in this new slice are **pending manual execution**.
Earlier web/backend/Python passes do not validate this slice. No Flutter SDK was
available on PATH; no build, test, package install, APK or live call was run by Codex.

## Commands

From repository root:

```powershell
dotnet run --project .\tests\AgentGatewayChecks
dotnet run --project .\tests\PurchaseRequestChecks
cd web
npm run lint
npm test
npm run build
```

Gateway checks use signed test JWTs and an internal HTTP double: no PostgreSQL,
Python or Gemini calls. PurchaseRequestChecks uses the existing real test database
configuration and performs its established cleanup. Gateway coverage includes
manager-only routing, unchanged request identity, status/resume routes, conflicts,
scrubbed failures, timeout behavior and rejection of insecure remote configuration.

From `mobile`, after the README setup:

```powershell
flutter analyze
flutter test
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:5289/api/
```

Tests cover API origin restrictions, authorization headers, no anonymous calls,
no automatic mutation retries, HTML rejection, decimals, QR input validation,
session entry, inventory search, owner-scoped run recovery, expired-session cleanup
and confirmed stock writes followed by failed refresh. There are 14 mobile tests
and 7 gateway check groups. They use synthetic records and HTTP doubles.

## Manual device and integration evidence

| Check | Expected | Result |
|---|---|---|
| Empty/invalid/expired token | No protected workspace or successful agent submission | Pending |
| Relaunch with valid stored token | Server validates identity before loading records | Pending |
| Disconnect | Token removed; protected UI and data cleared | Pending |
| Inventory search and low-stock filter | Matches actual API data, not fixtures | Pending |
| Decimal input 1.234, negative and zero | Rejected before stock submission | Pending |
| Record Use or Receive | One transaction; stock and web history agree | Pending |
| Lost response after stock save | No automatic retry; inspect history before another write | Pending |
| Supplier contact copy | Real registered contact details | Pending |
| Camera permission granted | Item QR opens the matching inventory item | Pending |
| Camera denied/invalid QR | Clear message and working manual-ID fallback | Pending |
| Submit mobile agent request | Network goes mobile → .NET → Python; real Pending record appears | Pending |
| Close/reopen during request | Same manager can recover same request ID and payload | Pending |
| Approve on web | One purchase; unchanged stock; mobile reflects decision after refresh | Pending |
| Python stopped | Safe error, same run ID retained, no invented recommendation | Pending |
| Short history | Agent requests manager estimate; no invented consumption | Pending |
| Narrow screen/keyboard/rotation | Forms remain usable without overflow | Pending |

Capture terminal output for automated checks, screenshots of camera and mobile
screens, and matching recommendation/purchase IDs across clients. Remove tokens,
keys, personal contact data and unnecessary device identifiers from evidence.

Remaining requirements: group login/registration/refresh-token flow, agreed
server-side catalogue roles, device execution and submission APK. Only Component 3
is included here, not the group's complete mobile application or all four agents.
