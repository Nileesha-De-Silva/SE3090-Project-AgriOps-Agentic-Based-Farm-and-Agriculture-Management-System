import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'api.dart';
import 'workspace.dart';
import 'screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  const address = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:5289/api/');
  try {
    final workspace = Workspace(Api(address, allowLocalHttp: kDebugMode));
    runApp(AgriOpsApp(workspace: workspace));
    workspace.restore();
  } catch (_) {
    runApp(const MaterialApp(home: Scaffold(body: Center(child: Padding(
      padding: EdgeInsets.all(24), child: Text('Configure API_BASE_URL with your HTTPS backend URL ending in /api/. Local HTTP is allowed only in debug builds.'),
    )))));
  }
}

class AgriOpsApp extends StatelessWidget {
  final Workspace workspace;
  const AgriOpsApp({super.key, required this.workspace});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'AgriOps', debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff356449)),
      scaffoldBackgroundColor: const Color(0xfff5f7f1),
      inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      appBarTheme: const AppBarTheme(backgroundColor: Color(0xfff5f7f1))),
    home: ListenableBuilder(listenable: workspace, builder: (context, _) => workspace.connected
      ? HomeScreen(workspace: workspace) : ConnectScreen(workspace: workspace)),
  );
}
