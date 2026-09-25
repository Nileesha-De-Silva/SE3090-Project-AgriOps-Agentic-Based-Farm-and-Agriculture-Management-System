import 'package:flutter/material.dart';
import 'widgets/app_theme.dart';
import 'screens/main_navigation_screen.dart';

void main() {
  runApp(const AgriOpsApp());
}

class AgriOpsApp extends StatelessWidget {
  const AgriOpsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriOps AI',
      theme: AppTheme.theme,
      home: const MainNavigationScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}