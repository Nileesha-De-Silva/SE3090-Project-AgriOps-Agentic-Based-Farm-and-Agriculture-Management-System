import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api/crop_analysis_api.dart';

void main() {
  group('CropAnalysisApi API Integration Tests (Component 2)', () {
    test('getPendingApprovals fetches assessments awaiting manager approval', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/cropanalysis/pending');
        return http.Response(
          jsonEncode([
            {
              'id': 'diag-001',
              'fieldId': 'f-3',
              'cropVariety': 'Tomato',
              'growthStage': 'Fruiting',
              'observationText': 'Caterpillars boring holes into tomatoes',
              'primaryIndicator': 'Helicoverpa armigera',
              'potentialStressFactors': ['Pest infestation'],
              'riskLevel': 'Critical',
              'recommendedActions': ['Spray Bacillus thuringiensis'],
              'suggestedTaskType': 'PesticideApplication',
              'priority': 'Critical',
              'status': 'PendingApproval',
              'createdAt': '2026-10-08T00:00:00Z',
            }
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final assessments = await CropAnalysisApi.getPendingApprovals(client: client);
      expect(assessments.length, 1);
      expect(assessments.first.id, 'diag-001');
      expect(assessments.first.cropVariety, 'Tomato');
      expect(assessments.first.riskLevel, 'Critical');
    });

    test('getAssessmentById fetches diagnostic assessment by identifier', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/cropanalysis/diag-001');
        return http.Response(
          jsonEncode({
            'id': 'diag-001',
            'fieldId': 'f-3',
            'cropVariety': 'Tomato',
            'growthStage': 'Fruiting',
            'observationText': 'Caterpillars boring holes into tomatoes',
            'primaryIndicator': 'Helicoverpa armigera',
            'riskLevel': 'Critical',
            'status': 'PendingApproval',
            'createdAt': '2026-10-08T00:00:00Z',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final assessment = await CropAnalysisApi.getAssessmentById('diag-001', client: client);
      expect(assessment.id, 'diag-001');
      expect(assessment.primaryIndicator, 'Helicoverpa armigera');
    });

    test('submitCropAnalysis posts observation payload to /api/cropanalysis', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/cropanalysis');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['fieldId'], 'field-10');
        expect(body['cropVariety'], 'Chili');
        expect(body['observationText'], 'Leaf curling and yellowing');

        return http.Response(
          jsonEncode({
            'id': 'diag-new-1',
            'fieldId': 'field-10',
            'cropVariety': 'Chili',
            'growthStage': 'Vegetative',
            'observationText': 'Leaf curling and yellowing',
            'primaryIndicator': 'Chili Leaf Curl Virus',
            'riskLevel': 'High',
            'status': 'PendingApproval',
            'createdAt': '2026-10-08T00:00:00Z',
          }),
          201,
          headers: {'content-type': 'application/json'},
        );
      });

      final created = await CropAnalysisApi.submitCropAnalysis(
        fieldId: 'field-10',
        cropVariety: 'Chili',
        growthStage: 'Vegetative',
        observationText: 'Leaf curling and yellowing',
        client: client,
      );

      expect(created.id, 'diag-new-1');
      expect(created.primaryIndicator, 'Chili Leaf Curl Virus');
      expect(created.riskLevel, 'High');
    });

    test('approveAssessment posts approval decision and generates remediation task', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/cropanalysis/diag-001/approve');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['comments'], 'Manager authorized urgent spray');

        return http.Response(
          jsonEncode({
            'id': 'tsk-remediate-1',
            'fieldId': 'f-3',
            'taskType': 'PesticideApplication',
            'priority': 'Critical',
            'description': 'Remediation task for Helicoverpa armigera',
            'targetDate': '2026-10-09T00:00:00Z',
            'status': 'Pending',
            'createdAt': '2026-10-08T00:00:00Z',
            'assignments': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final task = await CropAnalysisApi.approveAssessment(
        'diag-001',
        comments: 'Manager authorized urgent spray',
        client: client,
      );

      expect(task.id, 'tsk-remediate-1');
      expect(task.taskType, 'PesticideApplication');
      expect(task.priority, 'Critical');
    });

    test('rejectAssessment posts rejection reason to /api/cropanalysis/{id}/reject', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/cropanalysis/diag-001/reject');
        expect(request.method, 'POST');
        final body = jsonDecode(request.body);
        expect(body['comments'], 'Symptoms manageable by pruning');

        return http.Response(
          jsonEncode({'message': 'Diagnosis rejected'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      await expectLater(
        CropAnalysisApi.rejectAssessment(
          'diag-001',
          comments: 'Symptoms manageable by pruning',
          client: client,
        ),
        completes,
      );
    });
  });
}
