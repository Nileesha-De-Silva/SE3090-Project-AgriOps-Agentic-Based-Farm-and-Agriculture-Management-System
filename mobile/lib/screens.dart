import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'api.dart';
import 'workspace.dart';
import 'scanner.dart';
import 'inventory_views.dart';

class Notice extends StatelessWidget {
  final String text;
  const Notice(this.text, {super.key});
  @override
  Widget build(BuildContext context) => Container(width: double.infinity,
    margin: const EdgeInsets.symmetric(vertical: 8), padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
    child: Text(text));
}

class ConnectScreen extends StatefulWidget {
  final Workspace workspace;
  const ConnectScreen({super.key, required this.workspace});
  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}
class _ConnectScreenState extends State<ConnectScreen> {
  final username = TextEditingController(), password = TextEditingController();
  final fullName = TextEditingController(), email = TextEditingController(), phone = TextEditingController(), confirmPassword = TextEditingController();
  bool isRegister = false;
  String selectedRole = 'FieldWorker';
  String? localError;

  @override
  void dispose() {
    username.dispose();
    password.dispose();
    fullName.dispose();
    email.dispose();
    phone.dispose();
    confirmPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('AgriOps AI Mobile'),
      centerTitle: true,
    ),
    body: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          children: [
            Center(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.eco, size: 52, color: Colors.green),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'AgriOps AI Mobile',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              'Field Worker & Farmer Gateway',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 20),
            // Prominent Segmented Toggle for Sign In & Sign Up
            SegmentedButton<bool>(
              segments: const [
                ButtonSegment(
                  value: false,
                  label: Text('Sign In'),
                  icon: Icon(Icons.login),
                ),
                ButtonSegment(
                  value: true,
                  label: Text('Sign Up'),
                  icon: Icon(Icons.person_add_alt_1),
                ),
              ],
              selected: {isRegister},
              onSelectionChanged: (set) => setState(() {
                isRegister = set.first;
                localError = null;
              }),
            ),
            const SizedBox(height: 16),
            Text(
              isRegister
                  ? 'Create an account as a Field Worker or Farmer. Once registered in the database, sign in is unlocked.'
                  : 'Sign in with your registered account. Unregistered users must sign up first before signing in.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 16),
            if (!isRegister) ...[
              // Quick demo fill buttons for faster evaluation
              Wrap(
                spacing: 8,
                runSpacing: 4,
                alignment: WrapAlignment.center,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.engineering, size: 14),
                    label: const Text('Fill Field Worker', style: TextStyle(fontSize: 11)),
                    onPressed: () {
                      setState(() {
                        username.text = 'worker_kamal';
                        password.text = 'NileesHa2003#';
                        localError = null;
                      });
                    },
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.agriculture, size: 14),
                    label: const Text('Fill Farmer', style: TextStyle(fontSize: 11)),
                    onPressed: () {
                      setState(() {
                        username.text = 'farmer_sunil';
                        password.text = 'NileesHa2003#';
                        localError = null;
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],
            if (isRegister) ...[
              const Text('Select Role:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 6),
              Row(
                children: [
                  ChoiceChip(
                    avatar: const Icon(Icons.engineering, size: 16),
                    label: const Text('Field Worker'),
                    selected: selectedRole == 'FieldWorker',
                    onSelected: (val) { if (val) setState(() => selectedRole = 'FieldWorker'); },
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    avatar: const Icon(Icons.agriculture, size: 16),
                    label: const Text('Farmer'),
                    selected: selectedRole == 'Farmer',
                    onSelected: (val) { if (val) setState(() => selectedRole = 'Farmer'); },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: fullName,
                decoration: const InputDecoration(
                  labelText: 'Full Name *',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email *',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Contact Number (Optional)',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
              ),
              const SizedBox(height: 12),
            ],
            TextField(
              controller: username,
              decoration: const InputDecoration(
                labelText: 'Username *',
                prefixIcon: Icon(Icons.person_outline),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: password,
              obscureText: true,
              autocorrect: false,
              enableSuggestions: false,
              decoration: const InputDecoration(
                labelText: 'Password',
                helperText: 'Min 8 characters',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
            if (isRegister) ...[
              const SizedBox(height: 12),
              TextField(
                controller: confirmPassword,
                obscureText: true,
                autocorrect: false,
                enableSuggestions: false,
                decoration: const InputDecoration(
                  labelText: 'Confirm Password *',
                  prefixIcon: Icon(Icons.check_circle_outline),
                ),
              ),
            ],
            if (localError != null) ...[
              const SizedBox(height: 10),
              Notice(localError!),
            ],
            const SizedBox(height: 18),
            FilledButton.icon(
              icon: Icon(isRegister ? Icons.person_add : Icons.login),
              onPressed: widget.workspace.busy ? null : () async {
                setState(() => localError = null);
                final user = username.text.trim();
                final pass = password.text;

                if (user.isEmpty) {
                  setState(() => localError = 'Username is required.');
                  return;
                }
                if (pass.isEmpty) {
                  setState(() => localError = 'Password is required.');
                  return;
                }

                if (isRegister) {
                  final name = fullName.text.trim();
                  final mail = email.text.trim();
                  final confirm = confirmPassword.text;

                  if (name.isEmpty) {
                    setState(() => localError = 'Full Name is required.');
                    return;
                  }
                  if (mail.isEmpty || !mail.contains('@')) {
                    setState(() => localError = 'Valid email is required.');
                    return;
                  }
                  if (pass.length < 8) {
                    setState(() => localError = 'Password must be at least 8 characters.');
                    return;
                  }
                  if (pass != confirm) {
                    setState(() => localError = 'Passwords do not match.');
                    return;
                  }

                  final ok = await widget.workspace.register(
                    username: user,
                    password: pass,
                    fullName: name,
                    roleName: selectedRole,
                    email: mail,
                    contactNumber: phone.text.trim(),
                  );
                  if (mounted && ok) {
                    password.clear();
                    confirmPassword.clear();
                  }
                } else {
                  final ok = await widget.workspace.login(user, pass);
                  if (mounted && ok) password.clear();
                }
              },
              label: Text(isRegister ? 'Register & Sign In' : 'Sign In'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: widget.workspace.busy
                  ? null
                  : () => setState(() {
                        isRegister = !isRegister;
                        localError = null;
                      }),
              child: Text(isRegister ? 'Already have an account? Sign In' : 'New user? Sign Up as Field Worker or Farmer'),
            ),
            if (widget.workspace.busy) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(),
            ],
            if (widget.workspace.error != null) Notice(widget.workspace.error!),
            const SizedBox(height: 12),
            const Text(
              'Session credentials are authenticated via ASP.NET Core JWT backend.',
              style: TextStyle(fontSize: 11, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    ),
  );
}

class HomeScreen extends StatefulWidget {
  final Workspace workspace;
  const HomeScreen({super.key, required this.workspace});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}
class _HomeScreenState extends State<HomeScreen> {
  int page = 0;
  String search = '';
  bool lowOnly = false;
  Workspace get w => widget.workspace;
  void openItem(Record item) => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ItemScreen(workspace: w, itemId: item['id'] as String)));
  Future<void> scan() async {
    final id = await Navigator.of(context).push<String>(MaterialPageRoute(builder: (_) => ScannerScreen(inventoryIds: w.items.map((item) => '${item['id']}').toSet())));
    if (!mounted || id == null || !w.connected) return;
    final matches = w.items.where((i) => i['id'].toString().toLowerCase() == id);
    if (matches.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Item not found in the current inventory. Refresh and try again.')));
    } else { openItem(matches.first); }
  }
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('AgriOps'), actions: [
      IconButton(tooltip: 'Refresh from server', onPressed: w.busy ? null : w.refresh, icon: const Icon(Icons.refresh)),
      IconButton(tooltip: 'Disconnect', onPressed: w.busy ? null : w.disconnect, icon: const Icon(Icons.logout)),
    ]),
    bottomNavigationBar: NavigationBar(selectedIndex: page, onDestinationSelected: (value) => setState(() => page = value), destinations: [
      NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Inventory'),
      NavigationDestination(icon: Icon(Icons.people_outline), label: 'Suppliers'),
      if (w.canManage) const NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'Ask Agent'),
      if (w.canManage) const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Activity'),
    ]),
    body: SafeArea(child: Column(children: [
      if (w.busy) const LinearProgressIndicator(),
      if (w.error != null) Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Notice(w.error!)),
      if (w.stale && !w.busy) const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Notice('Refresh to load current records before making changes.')),
      Expanded(child: IndexedStack(index: page, children: [inventory(), suppliers(), if (w.canManage) ...[AgentScreen(workspace: w), activity()]])),
    ])),
  );
  Widget inventory() {
    final visible = w.items.where((i) => '${i['name']} ${i['category']}'.toLowerCase().contains(search.toLowerCase()) &&
      (!lowOnly || (num.parse('${i['currentStock']}') < num.parse('${i['minimumStockLevel']}')))).toList();
    return ListView(padding: const EdgeInsets.all(16), children: [
      Text('Inventory', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 16), TextField(onChanged: (v) => setState(() => search = v), decoration: const InputDecoration(labelText: 'Search items', prefixIcon: Icon(Icons.search))),
      Wrap(spacing: 12, crossAxisAlignment: WrapCrossAlignment.center, children: [
        FilterChip(label: const Text('Low stock'), selected: lowOnly, onSelected: (v) => setState(() => lowOnly = v)),
        TextButton.icon(onPressed: w.busy ? null : scan, icon: const Icon(Icons.qr_code_scanner), label: const Text('Scan item')),
      ]),
      if (visible.isEmpty) const Notice('No matching inventory items.'),
      for (final item in visible) Card(clipBehavior: Clip.antiAlias, child: InkWell(
        onTap: () => openItem(item),
        child: Padding(padding: const EdgeInsets.all(16), child: Column(
          crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(child: Text('${item['name']}', style: Theme.of(context).textTheme.titleLarge)),
              const SizedBox(width: 8), const Icon(Icons.chevron_right),
            ]),
            const SizedBox(height: 4), Text('${item['category']}'),
            const SizedBox(height: 12),
            Wrap(spacing: 16, runSpacing: 8, children: [
              Text('Available: ${amount(item['currentStock'])} ${item['unitOfMeasurement']}'),
              Text('Minimum: ${amount(item['minimumStockLevel'])} ${item['unitOfMeasurement']}'),
            ]),
            if (num.parse('${item['currentStock']}') < num.parse('${item['minimumStockLevel']}'))
              const Padding(padding: EdgeInsets.only(top: 8), child: Text('Low stock · below minimum')),
          ])),
      )),
    ]);
  }
  Widget suppliers() => SupplierContacts(suppliers: w.suppliers);
  Widget activity() => InventoryActivity(items: w.items, suppliers: w.suppliers,
    recommendations: w.recommendations, purchases: w.purchases);

}

class ItemScreen extends StatefulWidget {
  final Workspace workspace;
  final String itemId;
  const ItemScreen({super.key, required this.workspace, required this.itemId});
  @override
  State<ItemScreen> createState() => _ItemScreenState();
}
class _ItemScreenState extends State<ItemScreen> {
  final form = GlobalKey<FormState>();
  final quantity = TextEditingController(), notes = TextEditingController();
  String type = 'Use';
  bool submitted = false;
  late Future<List<Record>> history;
  @override
  void initState() { super.initState(); history = loadHistory(); }
  Future<List<Record>> loadHistory() => widget.workspace.api.list('inventory/${widget.itemId}/transactions');
  @override
  void dispose() { quantity.dispose(); notes.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: widget.workspace, builder: (context, _) {
    final w = widget.workspace;
    final item = w.items.where((i) => i['id'] == widget.itemId).firstOrNull;
    if (!w.connected) return Scaffold(appBar: AppBar(title: const Text('Session ended')),
      body: const Padding(padding: EdgeInsets.all(20), child: Text('Go back and connect again to view inventory.')));
    return Scaffold(appBar: AppBar(title: Text('${item?['name'] ?? 'Inventory item'}')), body: ListView(padding: const EdgeInsets.all(20), children: [
      if (!w.connected || item == null) const Notice('Reconnect and refresh inventory to open this item.'),
      if (item != null) Text('${amount(item['currentStock'])} ${item['unitOfMeasurement']} available', style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 8), SelectableText('Item ID: ${widget.itemId}'),
      if (item != null) OutlinedButton.icon(
        onPressed: w.busy ? null : () => Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => InventoryQrLabelScreen(itemId: widget.itemId, itemName: '${item['name']}'))),
        icon: const Icon(Icons.qr_code), label: const Text('Show QR label')),

      const SizedBox(height: 20), if (w.canUse) Form(key: form, autovalidateMode: AutovalidateMode.onUserInteraction, child: Column(children: [
        DropdownButtonFormField<String>(initialValue: type, decoration: const InputDecoration(labelText: 'Stock movement'),
          items: [const DropdownMenuItem(value: 'Use', child: Text('Use stock')), if (w.canReceive) const DropdownMenuItem(value: 'Receive', child: Text('Receive stock'))],
          onChanged: w.canWrite && !submitted ? (v) => setState(() => type = v!) : null),
        const SizedBox(height: 12), TextFormField(controller: quantity,
          enabled: w.canWrite && !submitted && item != null,
          validator: (value) {
            final invalid = quantityError(value);
            if (invalid != null) return invalid;
            final available = num.tryParse('${item?['currentStock']}');
            if (type == 'Use' && available != null && num.parse(value!.trim()) > available) {
              return 'Only ${amount(available)} ${item?['unitOfMeasurement']} available.';
            }
            return null;
          },
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(labelText: 'Quantity (${item?['unitOfMeasurement'] ?? 'item units'})',
            helperText: type == 'Use' ? 'Amount used on the farm. Maximum 2 decimal places.' : 'Amount physically received. Maximum 2 decimal places.',
            helperMaxLines: 3, errorMaxLines: 3)),
        const SizedBox(height: 12), TextFormField(controller: notes, enabled: w.canWrite && !submitted && item != null, maxLength: 500, decoration: const InputDecoration(labelText: 'Notes (optional)')),
        FilledButton(onPressed: !w.canWrite || submitted || item == null ? null : () async {
          if (!form.currentState!.validate()) return;
          setState(() => submitted = true);
          final ok = await w.movement(widget.itemId, type, quantity.text.trim(), notes.text);
          if (!mounted) return;
          setState(() { history = loadHistory(); if (ok) { quantity.clear(); notes.clear(); } });
          if (ok) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stock movement recorded.')));
        }, child: const Text('Record movement')),
        if (submitted) const Notice('Check the history below before entering another movement. Close and reopen this item to continue.'),
      ])),
      if (w.busy) const LinearProgressIndicator(),
      if (w.error != null) Notice(w.error!),
      const SizedBox(height: 24), Row(children: [Expanded(child: Text('Stock history', style: Theme.of(context).textTheme.titleLarge)),
        IconButton(tooltip: 'Refresh history', onPressed: w.busy || !w.connected ? null : () => setState(() => history = loadHistory()), icon: const Icon(Icons.refresh))]),
      FutureBuilder<List<Record>>(future: history, builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) return const Center(child: CircularProgressIndicator());
        if (snapshot.hasError) return const Notice('History could not be loaded. Use refresh to check again.');
        final records = snapshot.data ?? [];
        if (records.isEmpty) return const Notice('No stock movements recorded.');
        return Column(children: records.map((m) => ListTile(title: Text('${m['transactionType']} · ${amount(m['quantity'])}'),
          subtitle: Text('${inventoryDate(m['transactionDate'])}\n${m['notes'] ?? ''}'))).toList());
      }),
    ]));
  });
}

class AgentScreen extends StatefulWidget {
  final Workspace workspace;
  const AgentScreen({super.key, required this.workspace});
  @override
  State<AgentScreen> createState() => _AgentScreenState();
}
class _AgentScreenState extends State<AgentScreen> {
  final form = GlobalKey<FormState>();
  final message = TextEditingController(), weekly = TextEditingController(), safety = TextEditingController(text: '7');
  String? itemId;
  @override
  void initState() {
    super.initState();
    final input = widget.workspace.runRequest;
    if (input != null) {
      itemId = input['inventory_item_id'] as String?;
      message.text = '${input['message'] ?? ''}';
      weekly.text = '${input['weekly_estimate'] ?? ''}';
      safety.text = '${input['safety_days'] ?? 7}';
    }
  }
  @override
  void dispose() { message.dispose(); weekly.dispose(); safety.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    final w = widget.workspace;
    final locked = w.runRequest != null;
    final run = w.run;
    final selected = w.items.any((i) => i['id'] == itemId) ? itemId : null;
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text('Ask inventory agent', style: Theme.of(context).textTheme.headlineMedium),
      const Notice('Choose an item and tell the agent your supplier preferences. It checks usage, stock and supplier offers. A manager must approve any recommendation in the web app.'),
      Form(key: form, child: Column(children: [
        DropdownButtonFormField<String>(key: ValueKey(selected), initialValue: selected, isExpanded: true, decoration: const InputDecoration(labelText: 'Inventory item'),
          items: w.items.map((i) => DropdownMenuItem(value: i['id'] as String, child: Text('${i['name']}', overflow: TextOverflow.ellipsis))).toList(),
          validator: (v) => v == null ? 'Select an item.' : null,
          onChanged: locked ? null : (v) => setState(() => itemId = v)),
        const SizedBox(height: 12), TextFormField(controller: message, enabled: !locked, maxLength: 500, minLines: 2, maxLines: 4,
          decoration: const InputDecoration(labelText: 'What matters for this order?', hintText: 'For example: prefer faster delivery if stock may run out.')),
        ExpansionTile(maintainState: true, title: const Text('Demand settings'), subtitle: const Text('Weekly estimate only if usage history is missing'), children: [
          const Padding(padding: EdgeInsets.only(bottom: 12), child: Text('Leave weekly usage blank when recorded usage is available. For a new item, enter how much you expect to use in one week.')),
          TextFormField(controller: weekly, enabled: !locked, keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (v) => (v ?? '').trim().isEmpty ? null : quantityError(v), decoration: const InputDecoration(labelText: 'Expected weekly usage (optional)')),
          const SizedBox(height: 12), TextFormField(controller: safety, enabled: !locked, keyboardType: TextInputType.number,
            validator: (v) { final n = int.tryParse(v ?? ''); return n == null || n < 0 || n > 90 ? 'Enter 0–90 days.' : null; },
            decoration: const InputDecoration(labelText: 'Safety buffer (days)')), const SizedBox(height: 12),
        ]),
        if (!locked) FilledButton.icon(icon: const Icon(Icons.auto_awesome), label: const Text('Generate recommendation'), onPressed: !w.canWrite ? null : () {
          if (!form.currentState!.validate()) return;
          w.startRun({'request_id': const Uuid().v4(), 'inventory_item_id': itemId,
            'message': message.text.trim(), 'safety_days': int.parse(safety.text),
            if (weekly.text.trim().isNotEmpty) 'weekly_estimate': weekly.text.trim()});
        }),
      ])),
      if (locked) ...[
        const SizedBox(height: 16), SelectableText('Run ID: ${w.runRequest!['request_id']}'),
        Notice(run == null ? 'Check this run before retrying. It is saved so you can return to it after closing the app.' : switch (run['status']) {
          'awaiting_approval' => 'Ready for manager review in the web app.',
          'no_action' => 'Stock is covered. No reorder is needed for this plan.',
          'approved' => 'The manager approved this recommendation.',
          'rejected' => 'The manager rejected this recommendation.',
          'blocked' => 'The agent needs more information or an existing recommendation needs review.',
          'failed' => 'The agent could not generate a valid recommendation.',
          _ => 'Status: ${run['status']}',
        }),
        if (run != null && run['error'] != null) Notice('Agent could not complete this request: ${run['error']}'),
        if (run != null && run['recommendation'] is Map) AgentRecommendationCard(
          recommendation: Map<String, dynamic>.from(run['recommendation'] as Map),
          items: w.items, suppliers: w.suppliers),
        Wrap(spacing: 8, children: [
          OutlinedButton(onPressed: w.busy ? null : () => w.checkRun(), child: const Text('Check status')),
          if (run == null) OutlinedButton(onPressed: w.busy ? null : w.retrySameRun, child: const Text('Retry same request')),
          if (run?['canRetry'] == true || run?['status'] == 'awaiting_approval') OutlinedButton(onPressed: w.busy ? null : () => w.checkRun(resume: true), child: const Text('Resume / check decision')),
          if (run != null && run['canRetry'] != true && run['status'] != 'awaiting_approval') TextButton(onPressed: w.busy ? null : w.newRun, child: const Text('New request')),
        ]),
      ],
    ]);
  }
}
