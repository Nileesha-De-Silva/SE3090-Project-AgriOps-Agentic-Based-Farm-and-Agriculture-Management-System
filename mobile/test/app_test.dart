import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/main.dart';
import 'package:agriops_mobile/workspace.dart';

void main() {
  testWidgets('disconnected users see connection screen, not protected actions', (tester) async {
    final workspace = Workspace(Api('https://farm.example/api/'));
    await tester.pumpWidget(AgriOpsApp(workspace: workspace));
    expect(find.text('Manager access token'), findsOneWidget);
    expect(find.text('Generate recommendation'), findsNothing);
    expect(find.byType(NavigationBar), findsNothing);
    await tester.pumpWidget(const SizedBox());
    workspace.dispose();
  });
  testWidgets('connected inventory supports search and empty state', (tester) async {
    final workspace = Workspace(Api('https://farm.example/api/'))
      ..connected = true ..stale = false
      ..items = [{'id':'00000000-0000-4000-8000-000000000001','name':'Neem oil','category':'Pesticide','currentStock':5,'minimumStockLevel':10,'unitOfMeasurement':'litres'}];
    await tester.pumpWidget(AgriOpsApp(workspace: workspace));
    expect(find.text('Neem oil'), findsWidgets);
    await tester.enterText(find.widgetWithText(TextField, 'Search items'), 'fertilizer');
    await tester.pump();
    expect(find.text('No matching inventory items.'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    workspace.dispose();
  });
}
