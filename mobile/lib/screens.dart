import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'api.dart';
import 'workspace.dart';
import 'scanner.dart';

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
  final token = TextEditingController();
  @override
  void dispose() { token.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('AgriOps · Inventory')),
    body: Center(child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 520), child: ListView(
      shrinkWrap: true, padding: const EdgeInsets.all(24), children: [
        const Icon(Icons.eco_outlined, size: 64), const SizedBox(height: 20),
        Text('Your farm, on hand', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        const Text('Development connection: enter a valid manager token issued by the shared authentication service. Group login and registration are still pending.'),
        const SizedBox(height: 20),
        TextField(controller: token, obscureText: true, autocorrect: false, enableSuggestions: false,
          decoration: const InputDecoration(labelText: 'Manager access token')),
        const SizedBox(height: 12),
        FilledButton(onPressed: widget.workspace.busy ? null : () async {
          if (token.text.trim().isEmpty) return;
          final ok = await widget.workspace.connect(token.text);
          if (mounted && ok) token.clear();
        }, child: const Text('Connect securely')),
        if (widget.workspace.busy) const LinearProgressIndicator(),
        if (widget.workspace.error != null) Notice(widget.workspace.error!),
        const Text('The token is stored in device secure storage and removed when you disconnect.'),
      ]))));
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
    final id = await Navigator.of(context).push<String>(MaterialPageRoute(builder: (_) => const ScannerScreen()));
    if (!mounted || id == null) return;
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
    bottomNavigationBar: NavigationBar(selectedIndex: page, onDestinationSelected: (value) => setState(() => page = value), destinations: const [
      NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Inventory'),
      NavigationDestination(icon: Icon(Icons.people_outline), label: 'Suppliers'),
      NavigationDestination(icon: Icon(Icons.auto_awesome_outlined), label: 'Ask Agent'),
      NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Activity'),
    ]),
    body: SafeArea(child: Column(children: [
      if (w.busy) const LinearProgressIndicator(),
      if (w.error != null) Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Notice(w.error!)),
      if (w.stale && !w.busy) const Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Notice('Refresh to load current records before making changes.')),
      Expanded(child: IndexedStack(index: page, children: [inventory(), suppliers(), AgentScreen(workspace: w), activity()])),
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
      for (final item in visible) Card(child: ListTile(onTap: () => openItem(item),
        title: Text('${item['name']}'), subtitle: Text('${item['category']} · Minimum ${amount(item['minimumStockLevel'])}'),
        trailing: Text('${amount(item['currentStock'])}\n${item['unitOfMeasurement']}', textAlign: TextAlign.end))),
    ]);
  }
  Widget suppliers() => ListView(padding: const EdgeInsets.all(16), children: [
    Text('Supplier contacts', style: Theme.of(context).textTheme.headlineMedium),
    const Notice('Supplier prices and item links are managed in web Inventory. Contact details below can be selected and copied.'),
    if (w.suppliers.isEmpty) const Notice('No suppliers registered yet.'),
    for (final s in w.suppliers) Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('${s['name']}', style: Theme.of(context).textTheme.titleLarge),
      for (final key in ['contactPerson', 'phone', 'email', 'address'])
        if (s[key] != null && s[key].toString().isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: SelectableText('${s[key]}')),
    ]))),
  ]);
  String itemName(dynamic id) => w.items.where((i) => i['id'] == id).map((i) => '${i['name']}').firstOrNull ?? '$id';
  Widget activity() => ListView(padding: const EdgeInsets.all(16), children: [
    Text('Recommendations', style: Theme.of(context).textTheme.headlineMedium),
    const Notice('Managers review and approve recommendations in the web app. Refresh here to see their decisions. Approval does not add stock.'),
    if (w.recommendations.isEmpty) const Notice('No recommendations yet.'),
    for (final r in w.recommendations) Card(child: ExpansionTile(title: Text(itemName(r['inventoryItemId'])),
      subtitle: Text('${r['status']} · ${amount(r['recommendedQuantity'])} ${r['unitOfMeasurement']}'),
      children: [Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('${r['reason']}'), const SizedBox(height: 8), Text('Estimated cost: LKR ${amount(r['estimatedCost'])}'),
        if (r['decisionNote'] != null) Text('Manager note: ${r['decisionNote']}'),
      ]))])),
    const SizedBox(height: 24), Text('Purchase requests', style: Theme.of(context).textTheme.titleLarge),
    if (w.purchases.isEmpty) const Notice('No purchase requests yet.'),
    for (final p in w.purchases) Card(child: ListTile(title: Text(itemName(p['inventoryItemId'])), subtitle: Text('${p['status']} · ${amount(p['requestedQuantity'])} requested'))),
  ]);
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
      const SizedBox(height: 20), Form(key: form, child: Column(children: [
        DropdownButtonFormField<String>(initialValue: type, decoration: const InputDecoration(labelText: 'Stock movement'),
          items: const [DropdownMenuItem(value: 'Use', child: Text('Use stock')), DropdownMenuItem(value: 'Receive', child: Text('Receive stock'))],
          onChanged: w.canWrite && !submitted ? (v) => setState(() => type = v!) : null),
        const SizedBox(height: 12), TextFormField(controller: quantity, validator: quantityError,
          keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Quantity')),
        const SizedBox(height: 12), TextFormField(controller: notes, maxLength: 500, decoration: const InputDecoration(labelText: 'Notes (optional)')),
        FilledButton(onPressed: !w.canWrite || submitted ? null : () async {
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
          subtitle: Text('${m['transactionDate']}\n${m['notes'] ?? ''}'))).toList());
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
        if (run != null && run['recommendation'] is Map) Card(child: Padding(padding: const EdgeInsets.all(16), child: Text('${run['recommendation']['reason']}\nQuantity: ${amount(run['recommendation']['recommendedQuantity'])}\nRecommendation status: ${run['recommendation']['status']}'))),
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
