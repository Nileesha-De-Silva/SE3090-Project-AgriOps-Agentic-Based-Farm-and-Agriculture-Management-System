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
  });
}
