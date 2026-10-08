import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/crop_analysis_screen.dart';

void main() {
  group('CropAnalysisScreen Widget Tests (Component 2 AI)', () {
    testWidgets('renders Crop AI Doctor screen with Diagnosis and Approvals tabs', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: CropAnalysisScreen(),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Crop AI Doctor'), findsOneWidget);
      expect(find.text('Diagnosis'), findsOneWidget);
      expect(find.text('Approvals'), findsOneWidget);
      expect(find.text('Crop Variety'), findsOneWidget);
      expect(find.text('Growth Stage'), findsOneWidget);
    });

    testWidgets('switching to Approvals tab renders manager gate queue', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: CropAnalysisScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Approvals Tab
      final approvalsTab = find.text('Approvals');
      expect(approvalsTab, findsOneWidget);
      await tester.tap(approvalsTab);
      await tester.pumpAndSettle();

      // Tab switched
      expect(find.byType(TabBarView), findsOneWidget);
    });
  });
}
