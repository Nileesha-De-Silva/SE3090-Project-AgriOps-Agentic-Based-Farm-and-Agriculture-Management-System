import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'api.dart';

String inventoryLabel(List<Record> records, dynamic id) {
  for (final record in records) {
    if (record['id'] == id) return '${record['name']}';
  }
  return id == null ? 'Not recorded' : 'Record $id';
}

String inventoryDate(dynamic value) {
  final date = DateTime.tryParse('$value')?.toLocal();
  if (date == null) return 'Date not recorded';
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(date.day)}/${two(date.month)}/${date.year} ${two(date.hour)}:${two(date.minute)}';
}

class InventoryEmpty extends StatelessWidget {
  final String message;
  const InventoryEmpty(this.message, {super.key});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 24), child: Text(message));
}

class SupplierContacts extends StatefulWidget {
  final List<Record> suppliers;
  const SupplierContacts({super.key, required this.suppliers});
  @override
  State<SupplierContacts> createState() => _SupplierContactsState();
}

class _SupplierContactsState extends State<SupplierContacts> {
  String query = '';
  Future<void> copy(String label, String value) async {
    try {
      await Clipboard.setData(ClipboardData(text: value));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label copied')));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not copy. Select the contact text to copy it manually.')));
    }
  }
  @override
  Widget build(BuildContext context) {
    final matches = widget.suppliers.where((s) => ['name', 'contactPerson', 'phone', 'email', 'address']
      .any((key) => '${s[key] ?? ''}'.toLowerCase().contains(query.trim().toLowerCase()))).toList();
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text('Supplier contacts', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 8),
      const Text('Find a supplier and copy their contact details. Item prices are managed in web Inventory.'),
      const SizedBox(height: 16),
      TextField(key: const Key('supplier-search'), onChanged: (value) => setState(() => query = value),
        decoration: const InputDecoration(labelText: 'Search suppliers or contact details', prefixIcon: Icon(Icons.search))),
      const SizedBox(height: 12), Text('${matches.length} suppliers'),
      if (matches.isEmpty) InventoryEmpty(widget.suppliers.isEmpty ? 'No suppliers registered yet.' : 'No suppliers match your search.'),
      for (final supplier in matches) Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${supplier['name']}', style: Theme.of(context).textTheme.titleLarge),
          if ('${supplier['contactPerson'] ?? ''}'.trim().isNotEmpty)
            Padding(padding: const EdgeInsets.only(top: 8), child: Text('Contact person: ${supplier['contactPerson']}')),
          contact('Phone', supplier['phone'], Icons.phone_outlined),
          contact('Email', supplier['email'], Icons.email_outlined),
          contact('Address', supplier['address'], Icons.location_on_outlined),
        ]))),
    ]);
  }
  Widget contact(String label, dynamic raw, IconData icon) {
    final value = '${raw ?? ''}'.trim();
    return Padding(padding: const EdgeInsets.only(top: 12), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(padding: const EdgeInsets.only(top: 4, right: 12), child: Icon(icon, size: 20)),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: Theme.of(context).textTheme.labelMedium),
        SelectableText(value.isEmpty ? 'Not provided' : value),
      ])),
      if (value.isNotEmpty) IconButton(tooltip: 'Copy $label', onPressed: () => copy(label, value), icon: const Icon(Icons.copy_outlined)),
    ]));
  }
}

class InventoryActivity extends StatefulWidget {
  final List<Record> items, suppliers, recommendations, purchases;
  const InventoryActivity({super.key, required this.items, required this.suppliers,
    required this.recommendations, required this.purchases});
  @override
  State<InventoryActivity> createState() => _InventoryActivityState();
}

class _InventoryActivityState extends State<InventoryActivity> {
  bool showPurchases = false;
  String status = 'All';
  String query = '';
  @override
  Widget build(BuildContext context) {
    final source = showPurchases ? widget.purchases : widget.recommendations;
    final statuses = <String>{'All', 'Pending', 'Approved', if (!showPurchases) 'Rejected',
      ...source.map((r) => '${r['status'] ?? 'Unknown'}')};
    final activeStatus = statuses.contains(status) ? status : 'All';
    final visible = source.where((r) {
      final matchesStatus = activeStatus == 'All' || '${r['status'] ?? 'Unknown'}' == activeStatus;
      final searchable = [inventoryLabel(widget.items, r['inventoryItemId']),
        inventoryLabel(widget.suppliers, r['supplierId']), r['id'], r['purchaseRequestId']]
        .join(' ').toLowerCase();
      return matchesStatus && searchable.contains(query.trim().toLowerCase());
    }).toList()
      ..sort((a, b) => (DateTime.tryParse('${b[showPurchases ? 'requestedAt' : 'createdAt']}') ?? DateTime(1970))
        .compareTo(DateTime.tryParse('${a[showPurchases ? 'requestedAt' : 'createdAt']}') ?? DateTime(1970)));
    return ListView(padding: const EdgeInsets.all(20), children: [
      Text('Order activity', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 8),
      const Text('Review recommendations in the web app. Approval creates a purchase request; it does not receive stock or confirm delivery.'),
      const SizedBox(height: 16),
      Wrap(spacing: 8, children: [
        ChoiceChip(label: const Text('Recommendations'), selected: !showPurchases,
          onSelected: (_) => setState(() { showPurchases = false; status = 'All'; })),
        ChoiceChip(label: const Text('Purchase requests'), selected: showPurchases,
          onSelected: (_) => setState(() { showPurchases = true; status = 'All'; })),
      ]),
      const SizedBox(height: 8),
      Wrap(spacing: 8, children: statuses.map((s) => FilterChip(label: Text(s), selected: activeStatus == s,
        onSelected: (_) => setState(() => status = s))).toList()),
      const SizedBox(height: 12),
      TextField(key: const Key('activity-search'), onChanged: (value) => setState(() => query = value),
        decoration: const InputDecoration(labelText: 'Search item, supplier or reference', prefixIcon: Icon(Icons.search))),
      const SizedBox(height: 8), Text('${visible.length} records'),
      if (visible.isEmpty) const InventoryEmpty('No records match your search and status.'),
      for (final record in visible) Card(child: ExpansionTile(
        key: ValueKey('${showPurchases ? 'purchase' : 'recommendation'}-${record['id']}'),
        title: Text(inventoryLabel(widget.items, record['inventoryItemId'])),
        subtitle: Text('${record['status'] ?? 'Unknown'} · ${inventoryLabel(widget.suppliers, record['supplierId'])}\n'
          '${amount(record[showPurchases ? 'requestedQuantity' : 'recommendedQuantity'])} ${unit(record)}'),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(inventoryDate(record[showPurchases ? 'requestedAt' : 'createdAt'])),
          const SizedBox(height: 12),
          Text('Reason', style: Theme.of(context).textTheme.titleSmall),
          Text('${record['reason'] ?? 'No reason recorded.'}'),
          if (!showPurchases) ...[
            const SizedBox(height: 12),
            Text('Estimated total: LKR ${amount(record['estimatedCost'])}'),
            Text('Supplier delivery estimate: ${record['leadTimeDays']} days'),
            if (record['decisionNote'] != null) Text('Manager note: ${record['decisionNote']}'),
            if (record['purchaseRequestId'] != null) SelectableText('Purchase request: ${record['purchaseRequestId']}'),
          ],
          const SizedBox(height: 12), SelectableText('Reference: ${record['id']}'),
        ],
      )),
    ]);
  }
  String unit(Record record) {
    if (!showPurchases) return '${record['unitOfMeasurement'] ?? ''}';
    // Prefer the original recommendation unit, not the current catalogue value.
    for (final recommendation in widget.recommendations) {
      if (recommendation['purchaseRequestId'] == record['id']) return '${recommendation['unitOfMeasurement'] ?? ''}';
    }
    return '(unit not recorded)';
  }
}

class AgentRecommendationCard extends StatelessWidget {
  final Record recommendation;
  final List<Record> items, suppliers;
  const AgentRecommendationCard({super.key, required this.recommendation,
    required this.items, required this.suppliers});

  String value(String key) {
    final text = '${recommendation[key] ?? ''}'.trim();
    return text.isEmpty ? 'Not recorded' : text;
  }

  String number(String key) {
    final parsed = num.tryParse('${recommendation[key]}');
    return parsed == null || !parsed.isFinite ? 'Not recorded' : amount(parsed);
  }

  @override
  Widget build(BuildContext context) {
    final unit = value('unitOfMeasurement');
    final quantity = number('recommendedQuantity');
    final cost = number('estimatedCost');
    final price = number('unitPrice');
    return Card(child: Padding(padding: const EdgeInsets.all(16), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Reorder recommendation', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Text('Item: ${inventoryLabel(items, recommendation['inventoryItemId'])}'),
        Text('Supplier: ${inventoryLabel(suppliers, recommendation['supplierId'])}'),
        const SizedBox(height: 12),
        Text('Recommended quantity: $quantity${unit == 'Not recorded' ? '' : ' $unit'}'),
        Text('Unit price: ${price == 'Not recorded' ? price : 'LKR $price'}'),
        Text('Estimated total: ${cost == 'Not recorded' ? cost : 'LKR $cost'}'),
        Text('Delivery estimate: ${recommendation['leadTimeDays'] == null ? 'Not recorded' : '${recommendation['leadTimeDays']} days'}'),
        const Text('Delivery time is a supplier estimate, not a confirmed arrival date.'),
        const SizedBox(height: 12),
        Text('Why this supplier?', style: Theme.of(context).textTheme.titleSmall),
        Text(value('reason')),
        const SizedBox(height: 12),
        Text('Status: ${value('status')}'),
        if (recommendation['status'] == 'Pending')
          const Text('Awaiting manager review in the web app. No purchase has been approved yet.'),
        if (recommendation['status'] == 'Approved')
          const Text('Approved. Stock changes only when goods are physically received and recorded.'),
        if ('${recommendation['decisionNote'] ?? ''}'.trim().isNotEmpty)
          Text('Manager note: ${recommendation['decisionNote']}'),
        if (recommendation['purchaseRequestId'] != null)
          SelectableText('Purchase request: ${recommendation['purchaseRequestId']}'),
        const SizedBox(height: 12),
        SelectableText('Recommendation reference: ${value('id')}'),
      ])));
  }
}
