import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api/task_api.dart';

void main() {
  group('TaskApi API Integration Tests (Component 2)', () {
    test('getTasks fetches list of farm tasks with query filters', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks');
        expect(request.url.queryParameters['status'], 'InProgress');
        expect(request.url.queryParameters['priority'], 'High');
        return http.Response(
          jsonEncode([
            {
              'id': 'tsk-001',
              'fieldId': 'f-1',
              'taskType': 'CropMonitoring',
              'priority': 'High',
              'description': 'Scout border rows for fall armyworm',
              'targetDate': '2026-10-10T00:00:00Z',
              'status': 'InProgress',
              'createdAt': '2026-10-08T00:00:00Z',
              'assignments': [],
            }
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final tasks = await TaskApi.getTasks(
        status: 'InProgress',
        priority: 'High',
        client: client,
      );

      expect(tasks.length, 1);
      expect(tasks.first.id, 'tsk-001');
      expect(tasks.first.taskType, 'CropMonitoring');
      expect(tasks.first.priority, 'High');
    });

    test('getTaskById fetches individual task by UUID', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks/tsk-999');
        return http.Response(
          jsonEncode({
            'id': 'tsk-999',
            'fieldId': 'f-9',
            'taskType': 'Irrigation',
            'priority': 'Medium',
            'description': 'Flush drip lines',
            'targetDate': '2026-10-11T00:00:00Z',
            'status': 'Pending',
            'createdAt': '2026-10-08T00:00:00Z',
            'assignments': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final task = await TaskApi.getTaskById('tsk-999', client: client);
      expect(task.id, 'tsk-999');
      expect(task.description, 'Flush drip lines');
    });

    test('createTask posts new operation payload to /api/tasks', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['fieldId'], 'field-10');
        expect(body['taskType'], 'PesticideApplication');
        expect(body['priority'], 'Critical');

        return http.Response(
          jsonEncode({
            'id': 'tsk-new-1',
            'fieldId': 'field-10',
            'taskType': 'PesticideApplication',
            'priority': 'Critical',
            'description': 'Deploy bio-spray immediately',
            'targetDate': '2026-10-12T00:00:00Z',
            'status': 'Pending',
            'createdAt': '2026-10-08T00:00:00Z',
            'assignments': [],
          }),
          201,
          headers: {'content-type': 'application/json'},
        );
      });

      final newTask = await TaskApi.createTask(
        fieldId: 'field-10',
        taskType: 'PesticideApplication',
        priority: 'Critical',
        description: 'Deploy bio-spray immediately',
        targetDate: DateTime.parse('2026-10-12T00:00:00Z'),
        client: client,
      );

      expect(newTask.id, 'tsk-new-1');
      expect(newTask.taskType, 'PesticideApplication');
    });

    test('updateTaskStatus patches task status with audit remarks', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks/tsk-001/status');
        expect(request.method, 'PATCH');
        final body = jsonDecode(request.body);
        expect(body['newStatus'], 'InProgress');
        expect(body['remarks'], 'Worker started spraying');

        return http.Response(
          jsonEncode({
            'id': 'tsk-001',
            'fieldId': 'f-1',
            'taskType': 'PesticideApplication',
            'priority': 'High',
            'description': 'Spraying',
            'targetDate': '2026-10-10T00:00:00Z',
            'status': 'InProgress',
            'createdAt': '2026-10-08T00:00:00Z',
            'assignments': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final updated = await TaskApi.updateTaskStatus(
        'tsk-001',
        'InProgress',
        remarks: 'Worker started spraying',
        client: client,
      );

      expect(updated.status, 'InProgress');
    });

    test('submitEvidence posts photo url and returns task history audit record', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks/tsk-001/evidence');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['evidencePhotoUrl'], 'https://storage.local/photo.jpg');

        return http.Response(
          jsonEncode({
            'id': 'hist-01',
            'taskId': 'tsk-001',
            'previousStatus': 'InProgress',
            'newStatus': 'PendingVerification',
            'remarks': 'Foliage cleared',
            'evidencePhotoUrl': 'https://storage.local/photo.jpg',
            'timestamp': '2026-10-08T12:00:00Z',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final history = await TaskApi.submitEvidence(
        'tsk-001',
        evidencePhotoUrl: 'https://storage.local/photo.jpg',
        remarks: 'Foliage cleared',
        client: client,
      );

      expect(history.taskId, 'tsk-001');
      expect(history.newStatus, 'PendingVerification');
      expect(history.evidencePhotoUrl, 'https://storage.local/photo.jpg');
    });

    test('verifyEvidence posts approval decision from manager', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/tasks/tsk-001/verify');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['isApproved'], true);
        expect(body['remarks'], 'Work quality verified');

        return http.Response(
          jsonEncode({
            'id': 'tsk-001',
            'fieldId': 'f-1',
            'taskType': 'CropMonitoring',
            'priority': 'Medium',
            'description': 'Scouting completed',
            'targetDate': '2026-10-10T00:00:00Z',
            'status': 'Verified',
            'createdAt': '2026-10-08T00:00:00Z',
            'assignments': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final verified = await TaskApi.verifyEvidence(
        'tsk-001',
        isApproved: true,
        remarks: 'Work quality verified',
        client: client,
      );

      expect(verified.status, 'Verified');
    });

    test('throws exception with meaningful error message on non-200 HTTP response', () async {
      final client = MockClient((request) async {
        return http.Response(
          jsonEncode({'message': 'Task not found in operational database'}),
          404,
          headers: {'content-type': 'application/json'},
        );
      });

      expect(
        () async => await TaskApi.getTaskById('tsk-missing', client: client),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('Task not found'))),
      );
    });
  });
}
