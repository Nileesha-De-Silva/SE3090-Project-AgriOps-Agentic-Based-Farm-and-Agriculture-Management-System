import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/screens/task_evidence_upload_screen.dart';
import 'package:agriops_mobile/models/farm_task.dart';

void main() {
  group('TaskEvidenceUploadScreen Form Validation Tests (Component 2)', () {
    final mockTask = FarmTask(
      id: 'tsk-99',
      fieldId: 'field-south-3',
      taskType: 'PesticideApplication',
      priority: 'High',
      description: 'Apply organic copper spray on affected foliage',
      targetDate: '2026-10-10',
      status: 'PendingVerification',
      createdAt: '2026-10-05',
      assignments: [],
    );

    testWidgets('renders evidence form fields and submit button', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: TaskEvidenceUploadScreen(task: mockTask),
        ),
      );

      expect(find.text('Submit Task Evidence'), findsOneWidget);
      expect(find.byType(TextField), findsAtLeastNWidgets(2)); // Photo URL & Remarks
      expect(find.text('Submit Evidence & Complete Task'), findsOneWidget);
    });

    testWidgets('validates empty photo URL and shows warning snackbar', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: TaskEvidenceUploadScreen(task: mockTask),
        ),
      );

      // Tap submit with empty photo URL
      final submitBtn = find.text('Submit Evidence & Complete Task');
      await tester.tap(submitBtn);
      await tester.pump(); // Start animation / snackbar

      expect(find.text('Please provide an evidence photo URL'), findsOneWidget);
    });

    testWidgets('allows entering photo URL and completion remarks', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: TaskEvidenceUploadScreen(task: mockTask),
        ),
      );

      final textFields = find.byType(TextField);
      expect(textFields, findsAtLeastNWidgets(2));

      // Enter Photo URL in first textfield
      await tester.enterText(textFields.first, 'https://storage.local/evidence1.jpg');
      await tester.pump();

      // Enter Remarks in second textfield
      await tester.enterText(textFields.at(1), 'Foliage spraying completed without runoff.');
      await tester.pump();

      expect(find.text('https://storage.local/evidence1.jpg'), findsOneWidget);
      expect(find.text('Foliage spraying completed without runoff.'), findsOneWidget);
    });
  });
}
