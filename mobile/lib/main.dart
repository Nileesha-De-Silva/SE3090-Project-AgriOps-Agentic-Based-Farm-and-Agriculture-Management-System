import 'package:flutter/material.dart';
import 'widgets/app_theme.dart';
import 'screens/main_navigation_screen.dart';
import 'workspace.dart';
import 'screens.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AgriOpsApp());
}

class AgriOpsApp extends StatelessWidget {
  final Workspace? workspace;
  const AgriOpsApp({super.key, this.workspace});
  
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriOps AI',
      theme: AppTheme.theme,
      home: workspace != null
          ? ListenableBuilder(
              listenable: workspace!,
              builder: (context, _) => workspace!.connected
                  ? HomeScreen(workspace: workspace!)
                  : ConnectScreen(workspace: workspace!),
            )
          : const MainNavigationScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}