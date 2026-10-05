import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/main_navigation_screen.dart';

void main() {
  group('MainNavigationScreen Bottom Bar Navigation Tests', () {
    testWidgets('renders all 4 primary navigation tabs', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MainNavigationScreen(),
        ),
      );

      // Verify Material 3 NavigationBar is present
      expect(find.byType(NavigationBar), findsOneWidget);
      expect(find.byType(NavigationDestination), findsNWidgets(4));
      expect(find.text('Farms'), findsAtLeastNWidgets(1));
      expect(find.text('Tasks'), findsAtLeastNWidgets(1));
      expect(find.text('Crop Doctor'), findsAtLeastNWidgets(1));
      expect(find.text('Crops'), findsAtLeastNWidgets(1));
    });

    testWidgets('tapping Tasks tab switches navigation index', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MainNavigationScreen(),
        ),
      );

      // Tap on Tasks destination in NavigationBar
      final tasksDestination = find.text('Tasks');
      expect(tasksDestination, findsAtLeastNWidgets(1));
      await tester.tap(tasksDestination.first);
      await tester.pump();

      // Navigation bar updates selected index to 1
      final navBar = tester.widget<NavigationBar>(find.byType(NavigationBar));
      expect(navBar.selectedIndex, 1);
    });

    testWidgets('tapping Crop Doctor tab switches to AI diagnostic view', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MainNavigationScreen(),
        ),
      );

      final diagDestination = find.text('Crop Doctor');
      expect(diagDestination, findsAtLeastNWidgets(1));
      await tester.tap(diagDestination.first);
      await tester.pump();

      final navBar = tester.widget<NavigationBar>(find.byType(NavigationBar));
      expect(navBar.selectedIndex, 2);
    });
  });
}
