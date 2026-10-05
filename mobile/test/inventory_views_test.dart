import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/inventory_views.dart';
import 'package:agriops_mobile/scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:agriops_mobile/api.dart';

void main() {
  testWidgets('supplier search includes contacts and reports missing fields', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: SupplierContacts(suppliers: [
      {'id':'s1','name':'Harvest Direct','email':'orders@harvest.example'},
      {'id':'s2','name':'Green Farm','phone':'0112345678'},
    ]))));
    await tester.enterText(find.byKey(const Key('supplier-search')), 'orders@harvest');
    await tester.pump();
    expect(find.text('Harvest Direct'), findsOneWidget);
    expect(find.text('Green Farm'), findsNothing);
    expect(find.text('Not provided'), findsNWidgets(2));
    await tester.enterText(find.byKey(const Key('supplier-search')), 'not-found');
    await tester.pump();
    expect(find.text('No suppliers match your search.'), findsOneWidget);
  });

  testWidgets('copy phone sends only the selected contact to clipboard', (tester) async {
    String? copied;
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.setData') copied = (call.arguments as Map)['text'] as String;
      return null;
    });
    addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: SupplierContacts(suppliers: [
      {'id':'s1','name':'Harvest Direct','phone':'0112345678'},
    ]))));
    await tester.tap(find.byTooltip('Copy Phone'));
    await tester.pump();
    expect(copied, '0112345678');
    expect(find.text('Phone copied'), findsOneWidget);
  });

  testWidgets('activity filters decisions and keeps purchase snapshot units', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: InventoryActivity(
      items: [{'id':'i1','name':'Neem oil','unitOfMeasurement':'changed-unit'}],
      suppliers: [{'id':'s1','name':'Harvest Direct'}],
      recommendations: [
        {'id':'r1','inventoryItemId':'i1','supplierId':'s1','status':'Pending','recommendedQuantity':5,'unitOfMeasurement':'litres','createdAt':'2026-09-30T10:00:00Z'},
        {'id':'r2','inventoryItemId':'i1','supplierId':'s1','status':'Approved','recommendedQuantity':7,'unitOfMeasurement':'litres','purchaseRequestId':'p1','createdAt':'2026-09-29T10:00:00Z'},
      ],
      purchases: [{'id':'p1','inventoryItemId':'i1','supplierId':'s1','status':'Approved','requestedQuantity':7,'requestedAt':'2026-09-29T10:00:00Z'}],
    ))));
    await tester.tap(find.widgetWithText(FilterChip, 'Pending'));
    await tester.pumpAndSettle();
    expect(find.text('1 records'), findsOneWidget);
    expect(find.byKey(const ValueKey('recommendation-r1')), findsOneWidget);
    expect(find.byKey(const ValueKey('recommendation-r2')), findsNothing);
    await tester.tap(find.widgetWithText(ChoiceChip, 'Purchase requests'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('purchase-p1')), findsOneWidget);
    expect(find.textContaining('7.00 litres'), findsOneWidget);
    expect(find.textContaining('changed-unit'), findsNothing);
  });

  testWidgets('agent recommendation uses saved prices and shows pending review', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: SingleChildScrollView(
      child: AgentRecommendationCard(
        items: [{'id':'i1','name':'Neem oil','unitCost':999,'unitOfMeasurement':'changed-unit'}],
        suppliers: [{'id':'s1','name':'Harvest Direct'}],
        recommendation: {'id':'r1','inventoryItemId':'i1','supplierId':'s1',
          'recommendedQuantity':'4.50','unitOfMeasurement':'litres','unitPrice':'120',
          'estimatedCost':'540','leadTimeDays':3,'status':'Pending','reason':'Lower cost for the required quantity.'},
      ),
    ))));
    expect(find.text('Supplier: Harvest Direct'), findsOneWidget);
    expect(find.text('Recommended quantity: 4.50 litres'), findsOneWidget);
    expect(find.text('Unit price: LKR 120.00'), findsOneWidget);
    expect(find.text('Estimated total: LKR 540.00'), findsOneWidget);
    expect(find.textContaining('Awaiting manager review'), findsOneWidget);
    expect(find.textContaining('changed-unit'), findsNothing);
    expect(find.textContaining('999'), findsNothing);
  });

  testWidgets('missing recommendation amounts are not presented as zero', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: SingleChildScrollView(
      child: AgentRecommendationCard(items: [], suppliers: [],
        recommendation: {'id':'r1','status':'Approved','purchaseRequestId':'p1','decisionNote':'Confirmed'}),
    ))));
    expect(find.text('Estimated total: Not recorded'), findsOneWidget);
    expect(find.text('Recommended quantity: Not recorded'), findsOneWidget);
    expect(find.text('Purchase request: p1'), findsOneWidget);
    expect(find.text('Manager note: Confirmed'), findsOneWidget);
    expect(find.textContaining('Stock changes only'), findsOneWidget);
  });

  testWidgets('scanner rejects URLs and unknown items before returning a known item', (tester) async {
    const id = '00000000-0000-4000-8000-000000000001';
    String? result;
    await tester.pumpWidget(MaterialApp(home: Builder(builder: (context) =>
      Scaffold(body: TextButton(onPressed: () async {
        result = await Navigator.of(context).push<String>(MaterialPageRoute(
          builder: (_) => const ScannerScreen(inventoryIds: {id})));
      }, child: const Text('Scan'))))));
    await tester.tap(find.text('Scan'));
    await tester.pumpAndSettle();
    final input = find.byType(TextField);
    await tester.enterText(input, 'https://example.com/$id');
    await tester.tap(find.text('Open item'));
    await tester.pumpAndSettle();
    expect(find.textContaining('not an AgriOps inventory label'), findsOneWidget);
    expect(result, isNull);
    await tester.enterText(input, '00000000-0000-4000-8000-000000000002');
    await tester.ensureVisible(find.text('Open item'));
    await tester.tap(find.text('Open item'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Item not found'), findsOneWidget);
    expect(result, isNull);
    await tester.enterText(input, 'agriops:item:$id');
    await tester.ensureVisible(find.text('Open item'));
    await tester.tap(find.text('Open item'));
    await tester.pumpAndSettle();
    expect(result, id);
    expect(find.text('Scan'), findsOneWidget);
  });

  testWidgets('scanner cannot open items when inventory is empty', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: ScannerScreen(inventoryIds: {})));
    expect(find.textContaining('No inventory items are loaded'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Open item')).onPressed, isNull);
  });

  testWidgets('QR label contains only a scanner-compatible inventory reference', (tester) async {
    const id = '00000000-0000-4000-8000-000000000001';
    String? copied;
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, (call) async {
      if (call.method == 'Clipboard.setData') copied = (call.arguments as Map)['text'] as String;
      return null;
    });
    addTearDown(() => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(SystemChannels.platform, null));
    await tester.pumpWidget(const MaterialApp(home: InventoryQrLabelScreen(itemId: id, itemName: 'Neem oil')));
    expect(find.byType(QrImageView), findsOneWidget);
    expect(find.text('Could not generate this label.'), findsNothing);
    expect(find.text('Neem oil'), findsOneWidget);
    // The selectable ID has its own scrollable; target the ListView's outer one.
    final labelList = find.descendant(
      of: find.byType(ListView), matching: find.byType(Scrollable)).first;
    expect(labelList, findsOneWidget);
    await tester.scrollUntilVisible(find.text('Copy label text'), 200, scrollable: labelList);
    await tester.tap(find.text('Copy label text'));
    await tester.pump();
    expect(copied, 'agriops:item:$id');
    expect(itemIdFromCode(copied!), id);
  });

  testWidgets('invalid item IDs cannot generate QR labels', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: InventoryQrLabelScreen(itemId: 'bad-id', itemName: 'Neem oil')));
    expect(find.byType(QrImageView), findsNothing);
    expect(find.textContaining('invalid inventory ID'), findsOneWidget);
    expect(find.text('Copy label text'), findsNothing);
  });
}
