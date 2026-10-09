import 'package:flutter/material.dart';
import 'widgets/app_theme.dart';
import 'screens/main_navigation_screen.dart';
import 'api/api_config.dart';
import 'api.dart';
import 'workspace.dart';
import 'screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AgriOpsApp());
}

class AgriOpsApp extends StatefulWidget {
  final Workspace? workspace;
  const AgriOpsApp({super.key, this.workspace});

  @override
  State<AgriOpsApp> createState() => _AgriOpsAppState();
}

class _AgriOpsAppState extends State<AgriOpsApp> {
  Workspace? _localWorkspace;

  Workspace get _activeWorkspace {
    if (widget.workspace != null) return widget.workspace!;
    if (_localWorkspace != null) return _localWorkspace!;
    String url = ApiConfig.baseUrl;
    if (!url.endsWith('/')) url = '$url/';
    final api = Api(url, allowLocalHttp: true);
    if (ApiConfig.authToken != null && ApiConfig.authToken!.isNotEmpty) {
      api.setToken(ApiConfig.authToken!);
    }
    _localWorkspace = Workspace(api);
    if (ApiConfig.authToken != null && ApiConfig.authToken!.isNotEmpty) {
      _localWorkspace!.connect(ApiConfig.authToken!);
    } else {
      _localWorkspace!.restore();
    }
    return _localWorkspace!;
  }

  @override
  void dispose() {
    _localWorkspace?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ws = _activeWorkspace;
    return MaterialApp(
      title: 'AgriOps AI',
      theme: AppTheme.theme,
      home: ListenableBuilder(
        listenable: ws,
        builder: (context, _) {
          final isConnected = ws.connected || ApiConfig.isAuthenticated;
          if (widget.workspace != null) {
            // Preserves workspace-specific test behavior (e.g. app_test.dart)
            return isConnected ? HomeScreen(workspace: ws) : ConnectScreen(workspace: ws);
          }
          // Default mobile client behavior: Sign In / Sign Up first, then full app
          return isConnected ? MainNavigationScreen(workspace: ws) : ConnectScreen(workspace: ws);
        },
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}