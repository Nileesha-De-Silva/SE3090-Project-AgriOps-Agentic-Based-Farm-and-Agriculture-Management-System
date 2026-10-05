import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/models/farm_task.dart';

void main() {
  group('FarmTask Model Unit Tests (Component 2)', () {
    test('FarmTask.fromJson parses operational task and nested assignments', () {
      final json = {
        'id': 'tsk-101',
        'fieldId': 'field-plot-4',
        'cropSeasonId': 'season-01',
        'taskType': 'PesticideApplication',
        'priority': 'Critical',
        'description': 'Target fungal spore outbreak with copper spray',
        'targetDate': '2026-10-10T00:00:00.000Z',
        'status': 'PendingVerification',
        'createdAt': '2026-10-05T08:00:00.000Z',
        'updatedAt': '2026-10-05T12:00:00.000Z',
        'assignments': [
          {
            'id': 'asg-01',
            'taskId': 'tsk-101',
            'workerId': 'wrk-09',
            'workerName': 'Sunil Shantha',
            'assignedDate': '2026-10-05T08:30:00.000Z',
            'status': 'Active',
          }
        ],
      };

      final task = FarmTask.fromJson(json);

      expect(task.id, 'tsk-101');
      expect(task.taskType, 'PesticideApplication');
      expect(task.priority, 'Critical');
      expect(task.status, 'PendingVerification');
      expect(task.assignments.length, 1);
      expect(task.assignments.first.workerName, 'Sunil Shantha');
    });

    test('FarmTask.fromJson handles empty assignments gracefully', () {
      final json = {
        'id': 'tsk-102',
        'fieldId': 'field-plot-1',
        'taskType': 'CropMonitoring',
        'priority': 'Low',
        'description': 'Inspect seedling emergence',
        'targetDate': '2026-10-12T00:00:00.000Z',
        'status': 'Pending',
        'createdAt': '2026-10-05T08:00:00.000Z',
        'assignments': null,
      };

      final task = FarmTask.fromJson(json);

      expect(task.id, 'tsk-102');
      expect(task.assignments, isEmpty);
      expect(task.status, 'Pending');
    });
  });
}
