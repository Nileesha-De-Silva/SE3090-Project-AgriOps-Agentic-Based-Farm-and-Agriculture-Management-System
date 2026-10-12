import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/workspace.dart';
import 'package:agriops_mobile/batch_screen.dart';
import 'package:agriops_mobile/scanner.dart';

const id = '00000000-0000-4000-8000-000000000001';
http.Response reply(dynamic data) => http.Response(jsonEncode(data), 200, headers: {'content-type': 'application/json'});
Record details({num remaining = 5, bool canIssue = true, String status = 'Available'}) => {
  'id': id, 'inventoryItemId': 'item', 'itemName': 'Tomato seed packets', 'category': 'Seeds',
  'supplierName': 'Seed supplier', 'unitOfMeasurement': 'packet', 'remainingQuantity': remaining,
  'totalItemStock': remaining, 'receivedQuantity': 5, 'batchNumber': 'TC-409', 'shelfLocation': 'Shelf A',
  'expirationDate': '2027-12-31', 'receivedAt': '2026-10-10', 'status': status,
  'isNextToIssue': canIssue, 'canIssue': canIssue, 'isLegacy': false,
};
void main() {
  test('batch labels accept only a fixed AgriOps batch reference', () {
    expect(batchIdFromCode('agriops:batch:$id'), id);
    expect(batchIdFromCode('https://example.com/$id'), isNull);
    expect(batchIdFromCode('agriops:batch:agriops:item:$id'), isNull);
    expect(batchIdFromCode('agriops:item:$id'), isNull);
    expect(itemIdFromCode('agriops:item:$id'), id);
  });
  testWidgets('batch QR works without a preloaded inventory ID', (tester) async {
    String? result;
    await tester.pumpWidget(MaterialApp(home: Builder(builder: (context) => Scaffold(body: TextButton(
      onPressed: () async { result = await Navigator.push<String>(context, MaterialPageRoute(builder: (_) => const ScannerScreen(inventoryIds: {}))); },
      child: const Text('Scan'))))));
    await tester.tap(find.text('Scan')); await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'agriops:batch:$id'); await tester.pump();
    await tester.ensureVisible(find.text('Open item')); await tester.tap(find.text('Open item')); await tester.pumpAndSettle();
    expect(result, 'agriops:batch:$id');
  });
  testWidgets('worker sees batch quantity and issuing refreshes it', (tester) async {
    num remaining = 5;
    Record? posted;
    final api = Api('https://farm.example/api/', client: MockClient((r) async {
      if (r.method == 'POST') { posted = Map<String, dynamic>.from(jsonDecode(r.body) as Map); remaining -= posted!['quantity'] as num; return reply({'id': 'movement'}); }
      if (r.url.path.contains('inventory-batches')) return reply(details(remaining: remaining));
      return reply([]);
    }));
    api.setToken('worker');
    final w = Workspace(api)..connected = true..canUse = true..stale = false;
    await tester.pumpWidget(MaterialApp(home: BatchScreen(workspace: w, batchId: id))); await tester.pumpAndSettle();
    expect(find.text('5.00 packet remaining in this batch'), findsOneWidget);
    expect(find.textContaining('2027-12-31'), findsOneWidget);
    final qty = find.widgetWithText(TextFormField, 'Quantity to issue (packet)');
    await tester.ensureVisible(qty); await tester.enterText(qty, '2');
    final confirm = find.text('I checked the item, batch label and actual expiration date.');
    await tester.ensureVisible(confirm); await tester.tap(confirm); await tester.pump();
    final button = find.text('Confirm issue from this batch');
    await tester.ensureVisible(button); await tester.tap(button); await tester.pumpAndSettle();
    expect(posted!['batchId'], id); expect(posted!['quantity'], 2);
    expect(find.text('3.00 packet remaining in this batch'), findsOneWidget);
    expect(find.text('Batch stock issued. Current quantity updated.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox()); w.dispose();
  });
  testWidgets('expired batch cannot be issued', (tester) async {
    final api = Api('https://farm.example/api/', client: MockClient((_) async => reply(details(canIssue: false, status: 'Expired'))));
    api.setToken('worker');
    final w = Workspace(api)..connected = true..canUse = true..stale = false;
    await tester.pumpWidget(MaterialApp(home: BatchScreen(workspace: w, batchId: id))); await tester.pumpAndSettle();
    expect(find.text('This batch has expired. Do not issue it; contact the manager.'), findsOneWidget);
    expect(tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Confirm issue from this batch')).onPressed, isNull);
    await tester.pumpWidget(const SizedBox()); w.dispose();
  });
}
