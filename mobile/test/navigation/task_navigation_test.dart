import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/task_evidence_upload_screen.dart';
import 'package:agriops_mobile/models/farm_task.dart';

void main() {
  group('Task Navigation Tests (Component 2)', () {
    final mockTask = FarmTask(
      id: 'tsk-nav-01',
      fieldId: 'field-1',
      taskType: 'PesticideApplication',
      priority: 'High',
      description: 'Apply fungicide spray',
      targetDate: '2026-10-10',
      status: 'InProgress',
      createdAt: '2026-10-08',
      assignments: [],
    );

    testWidgets('navigates to TaskEvidenceUploadScreen with task model and pops back', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => TaskEvidenceUploadScreen(task: mockTask),
                    ),
                  );
                },
                child: const Text('Open Evidence Screen'),
              ),
            ),
          ),
        ),
      );

      // Verify Initial Screen
      expect(find.text('Open Evidence Screen'), findsOneWidget);
      expect(find.text('Submit Task Evidence'), findsNothing);

      // Tap navigation trigger
      await tester.tap(find.text('Open Evidence Screen'));
      await tester.pumpAndSettle();

      // Verify Evidence Screen is pushed
      expect(find.text('Submit Task Evidence'), findsOneWidget);
      expect(find.text('Apply fungicide spray'), findsOneWidget);

      // Tap back button
      final backButton = find.byType(BackButton);
      expect(backButton, findsOneWidget);
      await tester.tap(backButton);
      await tester.pumpAndSettle();

      // Verify popped back to previous screen
      expect(find.text('Open Evidence Screen'), findsOneWidget);
      expect(find.text('Submit Task Evidence'), findsNothing);
    });
  });
}
