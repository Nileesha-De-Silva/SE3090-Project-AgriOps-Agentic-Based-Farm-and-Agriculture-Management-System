import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/tasks_screen.dart';

void main() {
  group('TasksScreen Widget Tests (Component 2)', () {
    testWidgets('renders task operations screen, status chips, and create FAB', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TasksScreen(),
        ),
      );

      // Initial loading state or resolved state
      await tester.pumpAndSettle();

      // Verify Screen Header
      expect(find.text('Farm Operations & Tasks'), findsOneWidget);

      // Verify Status Filter Chips
      expect(find.widgetWithText(ChoiceChip, 'All'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'Pending'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'InProgress'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'Completed'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'Verified'), findsOneWidget);

      // Verify Floating Action Button for New Task
      expect(find.byType(FloatingActionButton), findsOneWidget);
      expect(find.text('New Task'), findsOneWidget);
    });

    testWidgets('tapping status filter chip updates selection state', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: TasksScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Tap 'InProgress' chip
      final inProgressChip = find.widgetWithText(ChoiceChip, 'InProgress');
      expect(inProgressChip, findsOneWidget);
      await tester.tap(inProgressChip);
      await tester.pumpAndSettle();

      final chipWidget = tester.widget<ChoiceChip>(inProgressChip);
      expect(chipWidget.selected, isTrue);
    });
  });
}
