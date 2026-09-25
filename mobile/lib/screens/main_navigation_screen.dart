import 'package:flutter/material.dart';
import '../api/api_config.dart';
import '../widgets/app_theme.dart';
import 'farms_screen.dart';
import 'tasks_screen.dart';
import 'crop_analysis_screen.dart';
import 'crops_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    FarmsScreen(),
    TasksScreen(),
    CropAnalysisScreen(),
    CropsScreen(),
  ];

  void _showApiSettingsDialog() {
    final urlController = TextEditingController(text: ApiConfig.baseUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.settings_ethernet, color: AppTheme.primaryGreen),
            SizedBox(width: 8),
            Text('Backend API Config'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set the ASP.NET Core API base URL:\n'
              '• Android Emulator: http://10.0.2.2:5286/api\n'
              '• Web / Desktop: http://localhost:5286/api\n'
              '• Physical Device: http://<PC-LAN-IP>:5286/api',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                labelText: 'Base API URL',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              children: [
                ActionChip(
                  label: const Text('10.0.2.2 (Emulator)'),
                  onPressed: () => urlController.text = 'http://10.0.2.2:5286/api',
                ),
                ActionChip(
                  label: const Text('localhost'),
                  onPressed: () => urlController.text = 'http://localhost:5286/api',
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final newUrl = urlController.text.trim();
              if (newUrl.isNotEmpty) {
                setState(() {
                  ApiConfig.baseUrl = newUrl;
                });
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: AppTheme.primaryGreen,
                    content: Text('API URL updated to: $newUrl'),
                  ),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.eco, color: AppTheme.primaryGreen),
            SizedBox(width: 8),
            Text(
              'AgriOps AI Mobile',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Backend API Connection',
            onPressed: _showApiSettingsDialog,
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.landscape_outlined),
            selectedIcon: Icon(Icons.landscape, color: AppTheme.primaryGreen),
            label: 'Farms',
          ),
          NavigationDestination(
            icon: Icon(Icons.task_alt_outlined),
            selectedIcon: Icon(Icons.task_alt, color: AppTheme.primaryGreen),
            label: 'Tasks',
          ),
          NavigationDestination(
            icon: Icon(Icons.psychology_outlined),
            selectedIcon: Icon(Icons.psychology, color: AppTheme.primaryGreen),
            label: 'Crop Doctor',
          ),
          NavigationDestination(
            icon: Icon(Icons.grass_outlined),
            selectedIcon: Icon(Icons.grass, color: AppTheme.primaryGreen),
            label: 'Crops',
          ),
        ],
      ),
    );
  }
}
