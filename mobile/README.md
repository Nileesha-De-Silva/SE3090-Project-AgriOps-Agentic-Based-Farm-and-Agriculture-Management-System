# AgriOps Flutter inventory app

This is the Component 3 mobile client. It uses **only ASP.NET Core** at `/api/`.
The backend forwards manager-authorized AI requests to the internal Python service.
No Gemini key or agent service token belongs in the mobile app.

## Included

- Search inventory, filter low stock and view current quantities.
- Record Receive/Use movements with two-decimal validation and inspect history.
- View and copy registered supplier contact details.
- Ask the real inventory agent for a demand-based supplier recommendation.
- Check or resume the same agent run; its request is kept in secure storage,
  scoped to the API and verified manager identity, for recovery after restarting.
- View recommendation decisions and resulting purchase requests from the web app.
- Scan `agriops:item:<inventory UUID>` QR labels to open an item. Camera denial
  has a manual ID fallback. QR content is never used as a network URL.
- Store the manager token in device secure storage; disconnect removes it.

## Structure

```text
mobile/
  lib/
    main.dart        # app theme and session entry
    api.dart         # fixed-origin HTTP, safe failures, input helpers
    workspace.dart   # ChangeNotifier state, session, snapshots, run recovery
    screens.dart     # inventory, contacts, movements, agent and activity
    scanner.dart     # camera device feature and manual fallback
  test/              # API, state and widget checks
  tool/setup_android.ps1
  pubspec.yaml