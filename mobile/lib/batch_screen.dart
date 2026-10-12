import 'package:flutter/material.dart';
import 'api.dart';
import 'workspace.dart';
import 'scanner.dart';

class BatchScreen extends StatefulWidget {
  final Workspace workspace;
  final String batchId;
  const BatchScreen({super.key, required this.workspace, required this.batchId});
  @override
  State<BatchScreen> createState() => _BatchScreenState();
}

class _BatchScreenState extends State<BatchScreen> {
  Record? batch;
  String? error;
  bool loading = true, submitted = false, confirmed = false;
  final quantity = TextEditingController(), notes = TextEditingController();
  final form = GlobalKey<FormState>();
  final scroll = ScrollController();
  Workspace get w => widget.workspace;
  @override
  void initState() { super.initState(); load(); }
  Future<void> load({bool reset = false}) async {
    setState(() { loading = true; error = null; });
    try {
      final result = Map<String, dynamic>.from(await w.api.request('inventory-batches/${widget.batchId}') as Map);
      if (!mounted) return;
      setState(() {
        batch = result;
        if (reset) { submitted = false; confirmed = false; quantity.clear(); notes.clear(); }
      });
    } catch (e) {
      if (mounted) setState(() => error = e is ApiFailure ? e.message : 'Could not load this batch.');
    } finally { if (mounted) setState(() => loading = false); }
  }
  Future<void> issue() async {
    if (!form.currentState!.validate() || !confirmed || submitted || batch == null) return;
    setState(() => submitted = true);
    final ok = await w.movement('${batch!['inventoryItemId']}', 'Use', quantity.text.trim(), notes.text, batchId: widget.batchId);
    if (!mounted) return;
    await load();
    if (!mounted) return;
    if (ok) {
      if (scroll.hasClients) await scroll.animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Batch stock issued. Current quantity updated.')));
    } else { setState(() => error = w.error ?? 'Issue was not confirmed. Check the current quantity before trying again.'); }
  }
  @override
  void dispose() { quantity.dispose(); notes.dispose(); scroll.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: w, builder: (context, _) {
    final b = batch;
    final enabled = !loading && !w.busy && w.canWrite && !submitted && b?['canIssue'] == true;
    return Scaffold(
      appBar: AppBar(title: const Text('Stock batch'), actions: [IconButton(tooltip: 'Refresh current quantity', onPressed: loading || w.busy ? null : () => load(reset: true), icon: const Icon(Icons.refresh))]),
      body: SafeArea(child: ListView(controller: scroll, padding: const EdgeInsets.all(20), children: [
        if (loading || w.busy) const LinearProgressIndicator(),
        if (error != null) Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
        if (b != null) ...[
          Text('${b['itemName']}', style: Theme.of(context).textTheme.headlineSmall),
          Text('${b['category']}'), const SizedBox(height: 16),
          Text(b['remainingQuantity'] == null ? 'Historical batch quantity not tracked' : '${amount(b['remainingQuantity'])} ${b['unitOfMeasurement']} remaining in this batch', style: Theme.of(context).textTheme.titleLarge),
          Text('Total item stock: ${amount(b['totalItemStock'])} ${b['unitOfMeasurement']}'),
          Text('Status: ${b['status']}'),
          const Divider(height: 32),
          Text('Supplier: ${b['supplierName'] ?? 'Not recorded'}'),
          Text('Batch / lot: ${b['batchNumber'] ?? 'Not recorded'}'),
          Text('Shelf: ${b['shelfLocation'] ?? 'Not recorded'}'),
          Text('Expiration date: ${b['expirationDate'] ?? 'Not recorded — check the packaging'}', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text('Received: ${b['receivedAt'] ?? 'Not received yet'}'),
          Text('Batch ID: ${b['id']}'),
          const SizedBox(height: 16),
          if (b['status'] == 'Awaiting receipt') const Text('The purchase is approved but goods have not been recorded as received. No stock can be issued from this label.'),
          if (b['status'] == 'Expired') const Text('This batch has expired. Do not issue it; contact the manager.'),
          if (b['isLegacy'] == true) const Text('Existing stock: original batch dates were not recorded. Verify the packaging before use.'),
          if (b['isNextToIssue'] == true) const Text('Issue this batch first: it is the oldest received available batch (FIFO).'),
          if (b['nextBatchId'] != null && b['nextBatchId'] != b['id']) ...[
            const Text('An older received batch should be issued first (FIFO).'),
            OutlinedButton(onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => BatchScreen(workspace: w, batchId: '${b['nextBatchId']}'))), child: const Text('View batch to issue first')),
          ],
          const SizedBox(height: 16),
          if (w.canUse) Form(key: form, child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextFormField(controller: quantity, enabled: enabled,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: 'Quantity to issue (${b['unitOfMeasurement']})'),
              validator: (v) {
                final invalid = quantityError(v); if (invalid != null) return invalid;
                if (num.parse(v!.trim()) > (num.tryParse('${b['remainingQuantity']}') ?? 0)) return 'Quantity exceeds this batch’s remaining stock.';
                return null;
              }),
            TextFormField(controller: notes, enabled: enabled, maxLength: 500, decoration: const InputDecoration(labelText: 'Farm / issue notes')),
            CheckboxListTile(contentPadding: EdgeInsets.zero, value: confirmed, onChanged: enabled ? (v) => setState(() => confirmed = v ?? false) : null,
              title: const Text('I checked the item, batch label and actual expiration date.')),
            FilledButton(onPressed: enabled && confirmed ? issue : null, child: const Text('Confirm issue from this batch')),
            if (submitted) const Text('Check the updated remaining quantity. Use Refresh before recording another issue.'),
          ])),
          OutlinedButton.icon(onPressed: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => InventoryQrLabelScreen(itemId: widget.batchId, itemName: '${b['itemName']}', isBatch: true))),
            icon: const Icon(Icons.qr_code), label: const Text('Show batch QR label')),
        ],
      ])),
    );
  });
}

class ItemBatchesScreen extends StatefulWidget {
  final Workspace workspace;
  final String itemId;
  const ItemBatchesScreen({super.key, required this.workspace, required this.itemId});
  @override
  State<ItemBatchesScreen> createState() => _ItemBatchesScreenState();
}
class _ItemBatchesScreenState extends State<ItemBatchesScreen> {
  late Future<List<Record>> batches;
  @override
  void initState() { super.initState(); batches = load(); }
  Future<List<Record>> load() => widget.workspace.api.list('inventory/${widget.itemId}/batches');
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Batches & expiration'), actions: [IconButton(tooltip: 'Refresh batches', onPressed: () => setState(() => batches = load()), icon: const Icon(Icons.refresh))]),
    body: FutureBuilder<List<Record>>(future: batches, builder: (context, snapshot) {
      if (snapshot.hasError) return Padding(padding: const EdgeInsets.all(20), child: Text(snapshot.error is ApiFailure ? (snapshot.error as ApiFailure).message : 'Could not load batches.'));
      if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
      final rows = snapshot.data!;
      return ListView(padding: const EdgeInsets.all(20), children: [
        const Text('FIFO: issue the oldest received available batch first. Check the shelf label before using stock.'),
        if (rows.isEmpty) const Text('No tracked batches yet. New receipts create batches; existing stock is tracked at its next movement.'),
        for (final b in rows) Card(child: ListTile(
          title: Text('${b['batchNumber'] ?? 'Batch'} · ${amount(b['remainingQuantity'])} ${b['unitOfMeasurement']}'),
          subtitle: Text('Expiry: ${b['expirationDate'] ?? 'Not recorded'} · ${b['status']}${b['isNextToIssue'] == true ? ' · Issue first' : ''}'),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => BatchScreen(workspace: widget.workspace, batchId: '${b['id']}'))).then((_) { if (mounted) setState(() => batches = load()); }),
        )),
      ]);
    }),
  );
}
