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
  final Workspace? workspace;
  const MainNavigationScreen({super.key, this.workspace});

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
    if (widget.workspace == null) {
      _workspace?.dispose();
    }
    super.dispose();
  }

  Workspace _getWorkspace() {
    if (widget.workspace != null) return widget.workspace!;
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

  void _showSignUpDialog() => _showAuthDialog(initialIsSignUp: true);
  void _showLoginDialog() => _showAuthDialog(initialIsSignUp: false);

  void _showAuthDialog({bool initialIsSignUp = false}) {
    bool isSignUp = initialIsSignUp;
    String selectedRole = 'FieldWorker'; // FieldWorker or Farmer

    final userController = TextEditingController();
    final passController = TextEditingController();
    final confirmPassController = TextEditingController();
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController();

    bool loading = false;
    String? error;

    showDialog(
      context: context,
      barrierDismissible: !loading,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          actionsPadding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
          title: Row(
            children: [
              Icon(
                isSignUp ? Icons.person_add_alt_1 : Icons.lock_outline,
                color: AppTheme.primaryGreen,
              ),
              const SizedBox(width: 10),
              Text(
                isSignUp ? 'Mobile Client Sign Up' : 'Mobile Client Sign In',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
            ],
          ),
          content: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isSignUp
                        ? 'Register as a Field Worker or Farmer to access mobile tasks, field evidence, and operations.'
                        : 'Sign in with your registered credentials. Unregistered users must sign up first.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 14),

                  // Mode Toggle Segmented Button
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: loading
                                ? null
                                : () => setDialogState(() {
                                      isSignUp = false;
                                      error = null;
                                    }),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: !isSignUp ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: !isSignUp
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.06),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Center(
                                child: Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: !isSignUp ? FontWeight.bold : FontWeight.normal,
                                    color: !isSignUp ? AppTheme.primaryGreen : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: loading
                                ? null
                                : () => setDialogState(() {
                                      isSignUp = true;
                                      error = null;
                                    }),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: isSignUp ? Colors.white : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: isSignUp
                                    ? [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.06),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        )
                                      ]
                                    : null,
                              ),
                              child: Center(
                                child: Text(
                                  'Sign Up (New User)',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: isSignUp ? FontWeight.bold : FontWeight.normal,
                                    color: isSignUp ? AppTheme.primaryGreen : Colors.grey.shade700,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  if (isSignUp) ...[
                    // Role selection for mobile client
                    const Text(
                      'Choose Mobile Role:',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            avatar: const Icon(Icons.engineering, size: 16),
                            label: const Text('Field Worker'),
                            selected: selectedRole == 'FieldWorker',
                            selectedColor: AppTheme.primaryGreen.withValues(alpha: 0.18),
                            onSelected: (selected) {
                              if (selected) {
                                setDialogState(() => selectedRole = 'FieldWorker');
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ChoiceChip(
                            avatar: const Icon(Icons.agriculture, size: 16),
                            label: const Text('Farmer'),
                            selected: selectedRole == 'Farmer',
                            selectedColor: AppTheme.primaryGreen.withValues(alpha: 0.18),
                            onSelected: (selected) {
                              if (selected) {
                                setDialogState(() => selectedRole = 'Farmer');
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    Container(
                      margin: const EdgeInsets.only(top: 6, bottom: 12),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        border: Border.all(color: Colors.grey.shade200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            selectedRole == 'FieldWorker' ? Icons.task_alt : Icons.eco,
                            size: 16,
                            color: AppTheme.primaryGreen,
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              selectedRole == 'FieldWorker'
                                  ? 'Field Worker: task execution, evidence photos & scouting.'
                                  : 'Farmer: farm plot observations, crop logs & alerts.',
                              style: const TextStyle(fontSize: 11, color: Colors.black87),
                            ),
                          ),
                        ],
                      ),
                    ),

                    TextField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name *',
                        prefixIcon: Icon(Icons.badge_outlined, size: 20),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email Address *',
                        prefixIcon: Icon(Icons.email_outlined, size: 20),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),

                    TextField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Contact Number (Optional)',
                        prefixIcon: Icon(Icons.phone_outlined, size: 20),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],

                  TextField(
                    controller: userController,
                    decoration: InputDecoration(
                      labelText: isSignUp ? 'Username *' : 'Username',
                      prefixIcon: const Icon(Icons.person_outline, size: 20),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                  const SizedBox(height: 10),

                  TextField(
                    controller: passController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: isSignUp ? 'Password (Min 8 chars) *' : 'Password',
                      prefixIcon: const Icon(Icons.lock_outline, size: 20),
                      border: const OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),

                  if (isSignUp) ...[
                    const SizedBox(height: 10),
                    TextField(
                      controller: confirmPassController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Confirm Password *',
                        prefixIcon: Icon(Icons.check_circle_outline, size: 20),
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],

                  if (error != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        border: Border.all(color: Colors.red.shade200),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.error_outline, size: 16, color: Colors.red),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              error!,
                              style: const TextStyle(color: Colors.red, fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  if (loading) ...[
                    const SizedBox(height: 12),
                    const LinearProgressIndicator(),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: loading ? null : () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryGreen,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: loading
                  ? null
                  : () async {
                      final user = userController.text.trim();
                      final pass = passController.text;

                      if (user.isEmpty) {
                        setDialogState(() => error = 'Username is required.');
                        return;
                      }

                      if (pass.isEmpty) {
                        setDialogState(() => error = 'Password is required.');
                        return;
                      }

                      if (isSignUp) {
                        final fullName = nameController.text.trim();
                        final email = emailController.text.trim();
                        final confirmPass = confirmPassController.text;

                        if (fullName.isEmpty) {
                          setDialogState(() => error = 'Full Name is required.');
                          return;
                        }

                        if (email.isEmpty || !email.contains('@')) {
                          setDialogState(() => error = 'Please enter a valid email address.');
                          return;
                        }

                        if (pass.length < 8) {
                          setDialogState(() => error = 'Password must be at least 8 characters long.');
                          return;
                        }

                        if (pass != confirmPass) {
                          setDialogState(() => error = 'Passwords do not match.');
                          return;
                        }

                        setDialogState(() {
                          loading = true;
                          error = null;
                        });

                        final res = await AnalyticsApi.register(
                          username: user,
                          password: pass,
                          fullName: fullName,
                          roleName: selectedRole,
                          email: email,
                          contactNumber: phoneController.text.trim(),
                        );

                        if (res['success'] == true) {
                          final ws = _getWorkspace();
                          if (ApiConfig.authToken != null) {
                            ws.connect(ApiConfig.authToken!);
                          }
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: AppTheme.primaryGreen,
                                content: Text(
                                  'Welcome $fullName! Registered & signed in as ${ApiConfig.primaryRole}.',
                                ),
                              ),
                            );
                            setState(() {});
                          }
                        } else {
                          setDialogState(() {
                            loading = false;
                            error = res['error']?.toString() ?? 'Registration failed.';
                          });
                        }
                      } else {
                        // Sign In Flow
                        setDialogState(() {
                          loading = true;
                          error = null;
                        });

                        final res = await AnalyticsApi.loginWithResult(user, pass);
                        if (res['success'] == true) {
                          final ws = _getWorkspace();
                          if (ApiConfig.authToken != null) {
                            ws.connect(ApiConfig.authToken!);
                          }
                          if (context.mounted) {
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: AppTheme.primaryGreen,
                                content: Text(
                                  'Signed in as ${ApiConfig.currentUsername} (${ApiConfig.primaryRole}).',
                                ),
                              ),
                            );
                            setState(() {});
                          }
                        } else {
                          setDialogState(() {
                            loading = false;
                            error = res['error']?.toString() ?? 'Invalid credentials or account not found.';
                          });
                        }
                      }
                    },
              child: Text(isSignUp ? 'Register & Sign In' : 'Sign In'),
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
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.eco, color: AppTheme.primaryGreen, size: 20),
            SizedBox(width: 6),
            Flexible(
              child: Text(
                'AgriOps AI',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
                overflow: TextOverflow.ellipsis,
              ),
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
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.redAccent),
            tooltip: 'Sign Out / Disconnect',
            onPressed: () async {
              ApiConfig.clearSession();
              final ws = _getWorkspace();
              await ws.disconnect();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Signed out successfully.')),
                );
              }
            },
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
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: Colors.white.withValues(alpha: 0.2),
                        child: Icon(
                          ApiConfig.isAuthenticated ? Icons.person : Icons.agriculture,
                          color: Colors.white,
                          size: 26,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ApiConfig.isAuthenticated
                                  ? (ApiConfig.currentFullName ?? ApiConfig.currentUsername ?? 'User')
                                  : 'AgriOps Mobile Client',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (ApiConfig.isAuthenticated && ApiConfig.currentUsername != null)
                              Text(
                                '@${ApiConfig.currentUsername}',
                                style: const TextStyle(color: Colors.white70, fontSize: 12),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          ApiConfig.isAuthenticated
                              ? 'Role: ${ApiConfig.primaryRole}'
                              : 'Guest Mode (Sign in required)',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
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
              leading: const Icon(Icons.analytics, color: AppTheme.secondaryGreen),
              title: const Text('Production & Sentinel (Comp 4)'),
              subtitle: const Text('Yield Trends & AI Operations Sentinel'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                _openAnalytics();
              },
            ),
            ListTile(
              leading: const Icon(Icons.home_outlined, color: AppTheme.primaryGreen),
              title: const Text('Welcome Landing Page'),
              subtitle: const Text('View Welcome screen, Sign In & Sign Up'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ConnectScreen(workspace: _getWorkspace()),
                  ),
                );
              },
            ),
            if (ApiConfig.isAuthenticated) ...[
              ListTile(
                leading: const Icon(Icons.verified_user, color: AppTheme.primaryGreen),
                title: Text('${ApiConfig.currentUsername} (${ApiConfig.primaryRole})'),
                subtitle: const Text('Registered Mobile Client Session'),
              ),
              ListTile(
                leading: const Icon(Icons.logout, color: Colors.redAccent),
                title: const Text('Sign Out / Disconnect'),
                subtitle: const Text('Clear active session and return to Welcome'),
                onTap: () async {
                  Navigator.pop(context);
                  ApiConfig.clearSession();
                  final ws = _getWorkspace();
                  await ws.disconnect();
                  setState(() {});
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Signed out successfully. Session cleared.')),
                    );
                  }
                },
              ),
            ] else ...[
              ListTile(
                leading: const Icon(Icons.login, color: AppTheme.primaryGreen),
                title: const Text('Sign In'),
                subtitle: const Text('Use registered mobile credentials'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pop(context);
                  _showLoginDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.person_add_alt_1, color: Colors.teal),
                title: const Text('Register Mobile Account'),
                subtitle: const Text('Sign up as Field Worker or Farmer'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.pop(context);
                  _showSignUpDialog();
                },
              ),
            ],
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
