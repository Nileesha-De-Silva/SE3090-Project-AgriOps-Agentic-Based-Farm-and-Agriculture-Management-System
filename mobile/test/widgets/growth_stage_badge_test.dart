import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/widgets/growth_stage_badge.dart';

void main() {
  group('GrowthStageBadge Widget Tests (Component 1)', () {
    testWidgets('renders Germination badge correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GrowthStageBadge(stage: 'Germination'),
          ),
        ),
      );

      expect(find.text('Germination'), findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.blue.shade100);
    });

    testWidgets('renders Flowering badge with pink shade', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GrowthStageBadge(stage: 'Flowering'),
          ),
        ),
      );

      expect(find.text('Flowering'), findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.pink.shade100);
    });

    testWidgets('renders Harvesting badge with amber shade', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GrowthStageBadge(stage: 'Harvesting'),
          ),
        ),
      );

      expect(find.text('Harvesting'), findsOneWidget);
      final container = tester.widget<Container>(find.byType(Container));
      final decoration = container.decoration as BoxDecoration;
      expect(decoration.color, Colors.amber.shade200);
    });
  });
}
