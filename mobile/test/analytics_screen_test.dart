import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/analytics_screen.dart';

void main() {
  testWidgets('AnalyticsScreen renders title and Sentinel audit button', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: AnalyticsScreen(),
      ),
    );

    // Initial render
    expect(find.text('Production & Sentinel'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Let any async load complete
    await tester.pumpAndSettle();

    expect(find.text('Component 4 • Analytics & Sentinel'), findsOneWidget);
    expect(find.text('Run AI Sentinel Audit (Agent 4)'), findsOneWidget);
    expect(find.text('Total Yield'), findsOneWidget);
    expect(find.text('Harvest Records'), findsOneWidget);
  });
}
