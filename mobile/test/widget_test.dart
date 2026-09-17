import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:agriops_mobile/main.dart';

void main() {
  testWidgets('App launches and shows Farms screen', (WidgetTester tester) async {
    await tester.pumpWidget(const AgriOpsApp());

    expect(find.text('Farms'), findsOneWidget);
  });
}