import 'package:flutter/material.dart';
import '../api/api_config.dart';
import '../api/analytics_api.dart';
import '../api.dart';
import '../workspace.dart';
import '../screens.dart';
import '../scanner.dart';
import '../widgets/app_theme.dart';
import 'farms_screen.dart';
import 'tasks_screen.dart';
import 'crop_analysis_screen.dart';
import 'crops_screen.dart';
import 'analytics_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  Workspace? _workspace;

  final List<Widget> _screens = const [
    FarmsScreen(),
    TasksScreen(),
    CropAnalysisScreen(),
    CropsScreen(),
  ];

  @override
  void dispose() {
    _workspace?.dispose();
    super.dispose();
  }

  Workspace _getWorkspace() {
    if (_workspace != null) return _workspace!;
    String url = ApiConfig.baseUrl;
    if (!url.endsWith('/')) url = '$url/';
    final api = Api(url, allowLocalHttp: true);
    if (ApiConfig.authToken != null && ApiConfig.authToken!.isNotEmpty) {
      api.setToken(ApiConfig.authToken!);
    }
    _workspace = Workspace(api);
    if (ApiConfig.authToken != null && ApiConfig.authToken!.isNotEmpty) {
      _workspace!.connect(ApiConfig.authToken!);
    }
    if (ApiConfig.authToken == null) _workspace!.restore();
    return _workspace!;
  }

  void _openInventory() {
    final ws = _getWorkspace();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ListenableBuilder(
          listenable: ws,
          builder: (context, _) => ws.connected
              ? HomeScreen(workspace: ws)
              : ConnectScreen(workspace: ws),
        ),
      ),
    );
  }

  void _openScanner() {
    final ws = _getWorkspace();
    final ids = ws.items
        .map((i) => i['id']?.toString() ?? '')
        .where((id) => id.isNotEmpty)
        .toSet();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ScannerScreen(inventoryIds: ids),
      ),
    );
  }

  void _openAnalytics() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AnalyticsScreen(),
      ),
    );
  }

  void _showLoginDialog() {
    final userController = TextEditingController();
    final passController = TextEditingController();
    bool loading = false;
    String? error;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.lock_outline, color: AppTheme.primaryGreen),
              SizedBox(width: 8),
              Text('Sign in'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Sign in with your role-based credentials to access Component 3 (Inventory) & Component 4 (Sentinel).',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: userController,
                decoration: const InputDecoration(
                  labelText: 'Username',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: passController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 8),
                Text(error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
              ],
              if (loading) ...[
                const SizedBox(height: 8),
                const LinearProgressIndicator(),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: loading
                  ? null
                  : () async {
                      setDialogState(() {
                        loading = true;
                        error = null;
                      });
                      final success = await AnalyticsApi.login(
                        userController.text.trim(),
                        passController.text,
                      );
                      if (success) {
                        if (_workspace != null && ApiConfig.authToken != null) {
                          _workspace!.connect(ApiConfig.authToken!);
                        }
                        if (context.mounted) {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: AppTheme.primaryGreen,
                              content: Text('Signed in successfully.'),
                            ),
                          );
                          setState(() {});
                        }
                      } else {
                        setDialogState(() {
                          loading = false;
                          error = 'Invalid credentials or connection error.';
                        });
                      }
                    },
              child: const Text('Login'),
            ),
          ],
        ),
      ),
    );
  }

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
                  _workspace?.dispose();
                  _workspace = null;
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
            icon: const Icon(Icons.inventory_2_outlined),
            tooltip: 'Inventory (Component 3)',
            onPressed: _openInventory,
          ),
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            tooltip: 'Production & Sentinel (Component 4)',
            onPressed: _openAnalytics,
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            tooltip: 'Backend API Connection',
            onPressed: _showApiSettingsDialog,
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: AppTheme.primaryGreen),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const Icon(Icons.agriculture, size: 40, color: Colors.white),
                  const SizedBox(height: 8),
                  const Text(
                    'AgriOps Full-Stack Hub',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    ApiConfig.authToken != null ? 'Signed in' : 'Operational Mode (Guest)',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.landscape, color: AppTheme.primaryGreen),
              title: const Text('Farms & Fields (Comp 1)'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 0);
              },
            ),
            ListTile(
              leading: const Icon(Icons.task_alt, color: AppTheme.primaryGreen),
              title: const Text('Farm Tasks Kanban (Comp 2)'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 1);
              },
            ),
            ListTile(
              leading: const Icon(Icons.psychology, color: AppTheme.primaryGreen),
              title: const Text('Crop Doctor AI Diagnosis (Comp 2)'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 2);
              },
            ),
            ListTile(
              leading: const Icon(Icons.grass, color: AppTheme.primaryGreen),
              title: const Text('Crop Catalog & Seasons (Comp 1)'),
              onTap: () {
                Navigator.pop(context);
                setState(() => _currentIndex = 3);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.inventory_2, color: Colors.indigo),
              title: const Text('Inventory & Supplies (Comp 3)'),
              subtitle: const Text('Live Stock, Reorder Agent & Orders'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                _openInventory();
              },
            ),
            ListTile(
              leading: const Icon(Icons.qr_code_scanner, color: Colors.indigo),
              title: const Text('QR / Barcode Scanner (Comp 3)'),
              subtitle: const Text('Camera scanning device feature'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                _openScanner();
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.analytics, color: Colors.teal),
              title: const Text('Production & Sentinel (Comp 4)'),
              subtitle: const Text('Yield Trends & AI Operations Sentinel'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                _openAnalytics();
              },
            ),
            ListTile(
              leading: const Icon(Icons.vpn_key, color: Colors.blueGrey),
              title: Text(ApiConfig.authToken != null ? 'Switch / Re-login' : 'Sign in'),
              subtitle: const Text('JWT Authentication & RBAC'),
              onTap: () {
                Navigator.pop(context);
                _showLoginDialog();
              },
            ),
          ],
        ),
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
