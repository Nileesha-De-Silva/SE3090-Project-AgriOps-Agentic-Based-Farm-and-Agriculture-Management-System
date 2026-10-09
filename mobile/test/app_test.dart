import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/screens.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/main.dart';
import 'package:agriops_mobile/workspace.dart';

void main() {
  testWidgets('disconnected users see connection screen, not protected actions', (tester) async {
    final workspace = Workspace(Api('https://farm.example/api/'));
    await tester.pumpWidget(AgriOpsApp(workspace: workspace));
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Generate recommendation'), findsNothing);
    expect(find.byType(NavigationBar), findsNothing);
    await tester.pumpWidget(const SizedBox());
    workspace.dispose();
  });
  testWidgets('connected inventory supports search and empty state', (tester) async {
    final workspace = Workspace(Api('https://farm.example/api/'))
      ..connected = true ..stale = false ..canManage = true ..canUse = true ..canReceive = true
      ..items = [{'id':'00000000-0000-4000-8000-000000000001','name':'Neem oil','category':'Pesticide','currentStock':5,'minimumStockLevel':10,'unitOfMeasurement':'litres'}];
    await tester.pumpWidget(AgriOpsApp(workspace: workspace));
    expect(find.text('Neem oil'), findsWidgets);
    await tester.enterText(find.widgetWithText(TextField, 'Search items'), 'fertilizer');
    await tester.pump();
    expect(find.text('No matching inventory items.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    workspace.dispose();
  });

  testWidgets('use stock rejects excess quantity before sending a write', (tester) async {
    var writes = 0;
    final api = Api('https://farm.example/api/', client: MockClient((request) async {
      if (request.method != 'GET') writes++;
      return http.Response('[]', 200, headers: {'content-type': 'application/json'});
    }))..setToken('test-manager');
    final workspace = Workspace(api)
      ..connected = true ..stale = false ..canManage = true ..canUse = true ..canReceive = true
      ..items = [{'id':'00000000-0000-4000-8000-000000000001','name':'Neem oil','currentStock':5,'unitOfMeasurement':'litres'}];
    await tester.pumpWidget(MaterialApp(home: ItemScreen(
      workspace: workspace, itemId: '00000000-0000-4000-8000-000000000001')));
    await tester.pumpAndSettle();
    final quantity = find.widgetWithText(TextFormField, 'Quantity (litres)');
    await tester.enterText(quantity, '6');
    await tester.ensureVisible(find.text('Record movement'));
    await tester.tap(find.text('Record movement'));
    await tester.pumpAndSettle();
    expect(find.text('Only 5.00 litres available.'), findsOneWidget);
    expect(writes, 0);
    await tester.enterText(quantity, '4.50');
    await tester.pumpAndSettle();
    expect(find.text('Only 5.00 litres available.'), findsNothing);
    expect(writes, 0);
    await tester.pumpWidget(const SizedBox());
    workspace.dispose();
  });
}
