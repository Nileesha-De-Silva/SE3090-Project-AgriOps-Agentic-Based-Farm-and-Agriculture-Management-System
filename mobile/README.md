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

The development connection accepts an **existing valid manager JWT**. It is not
registration/login. Shared identity-provider login, registration, token renewal,
worker permissions and production catalogue authorization remain group work.
Do not weaken backend JWT checks to demonstrate the mobile app.

## Structure

```text
mobile/
  lib/
    main.dart       # app theme and session entry
    api.dart        # fixed-origin HTTP, safe failures, input helpers
    workspace.dart  # ChangeNotifier state, session, snapshots, run recovery
    screens.dart    # inventory, contacts, movements, agent and activity
    scanner.dart    # camera device feature and manual fallback
  test/             # API, state and widget checks
  tool/setup_android.ps1
  pubspec.yaml
```

`ChangeNotifier` with `ListenableBuilder` is sufficient for this one-component
app: one state owner manages session and server snapshots; the API client is
injectable for tests. `Navigator` handles item and camera screens; the bottom
navigation preserves the agent form. No offline write queue or automatic write
retry is used. A stock write with an uncertain result requires checking history.

## First-time Windows setup — run these yourself

Install the Flutter stable SDK and add its `bin` directory to PATH. Install the
Android SDK/emulator with Android Studio. See the official
[Flutter Android setup](https://docs.flutter.dev/platform-integration/android/setup).
Installing the Android Studio Flutter plugin alone does not install Flutter.

Open a new PowerShell terminal, then:

```powershell
flutter doctor
flutter doctor --android-licenses
cd "D:\SE3090_SEF_Project\SE3090-Project-AgriOps-Agentic-Based-Farm-and-Agriculture-Management-System\mobile"
powershell -ExecutionPolicy Bypass -File .\tool\setup_android.ps1
flutter pub get
flutter analyze
flutter test
```

The setup script generates Android files using your installed Flutter version in
a temporary folder, then copies **only** the Android platform into this project.
It does not replace `lib/`, tests or `pubspec.yaml`. It refuses to overwrite an
existing `android/`. It adds Internet/camera permissions, disables app backup,
sets Android minimum SDK to at least 23, and allows HTTP only for local debug
emulator/USB addresses. It does not install dependencies or run the app.
Commit generated `android/` and `pubspec.lock` after reviewing and testing them;
do not commit `local.properties`, build output or credentials.

## Run on an Android emulator

Keep ASP.NET Core running with its existing database configuration. From the
repository root, in its own terminal:

```powershell
cd backend/AgriOpsAI.Api
$env:InventoryAgent__BaseUrl = 'http://127.0.0.1:8003/'
dotnet run --launch-profile http
```

For AI recommendations, keep the configured Python service running in a second
terminal (repository root initially):

```powershell
cd agents/inventory-agent
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8003 --workers 1
```

Python still needs its server-side Gemini settings and service token. The manager
identity must be accepted by the backend. Start an emulator in Android Studio,
then from `mobile`:

```powershell
flutter devices
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5289/api/
```

Choose the Android emulator if prompted. `10.0.2.2` reaches the development PC
from the Android emulator; the Python address is never configured on mobile.
For an Android phone connected by USB with debugging authorized, use:

```powershell
adb reverse tcp:5289 tcp:5289
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:5289/api/
```

Use a trusted HTTPS API for remote devices and release builds. Certificate checks
are never disabled. A local HTTP debug APK can be built for demonstration:

```powershell
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:5289/api/
```

Output: `build/app/outputs/flutter-apk/app-debug.apk`. That address works only on
an emulator; use the USB address with `adb reverse` for a connected phone.
A release APK requires a real HTTPS backend URL and proper release signing:

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://YOUR-API-HOST/api/
```

Replace the placeholder before building. Do not distribute the generated debug
signing configuration as a production release.

## Demonstrate the integrated workflow

1. Connect mobile with a valid manager token and select an inventory item.
2. Record actual Use movements; verify the same history in web Inventory.
3. Submit Ask Agent on mobile with a supplier preference. For insufficient usage
   history, supply expected weekly usage in the item's units.
4. The Python agent reads backend evidence and saves a Pending recommendation.
5. Refresh web Recommendations and approve it once as a manager.
6. Refresh mobile Activity: show the decision and exactly one purchase request.
   Stock must remain unchanged by approval.
7. In Ask Agent, select Resume / check decision to let Python observe that decision.
8. Scan a QR label with the item's ID and demonstrate opening its stock history.

Generic Receive movements are not yet linked to purchase fulfilment, so they do
not close incoming purchase requests. Do not present delivery-history ranking,
automatic ordering or complete assignment compliance as implemented.

## Verification status

Source written; **Flutter analysis, tests, Android generation, APK build, camera
testing and live cross-client testing are pending user execution**. No mobile
SDK was found on PATH when inspected. See [test checklist](../docs/mobile-test-log.md).

Package references: [http](https://pub.dev/packages/http),
[secure storage](https://pub.dev/packages/flutter_secure_storage),
[camera scanner](https://pub.dev/packages/mobile_scanner),
[UUID](https://pub.dev/packages/uuid).
