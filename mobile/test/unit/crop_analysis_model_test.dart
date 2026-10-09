import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/models/crop_analysis_assessment.dart';

void main() {
  group('CropAnalysisAssessment Model Unit Tests (Component 2 AI)', () {
    test('CropAnalysisAssessment.fromJson correctly parses diagnosis and stress factors', () {
      final json = {
        'id': 'diag-77',
        'workflowId': 'wf-9988',
        'fieldId': 'field-plot-3',
        'cropVariety': 'Chili Pepper',
        'growthStage': 'Fruiting',
        'observationText': 'Curling leaves and silver sheen under foliage',
        'primaryIndicator': 'Thrips Infestation',
        'potentialStressFactors': ['Chili Thrips', 'Low Humidity'],
        'riskLevel': 'High',
        'recommendedActions': ['Deploy yellow sticky traps', 'Apply bio-pesticide spray'],
        'suggestedTaskType': 'PesticideApplication',
        'priority': 'High',
        'status': 'PendingApproval',
        'createdAt': '2026-10-05T10:15:00.000Z',
      };

      final assessment = CropAnalysisAssessment.fromJson(json);

      expect(assessment.id, 'diag-77');
      expect(assessment.cropVariety, 'Chili Pepper');
      expect(assessment.growthStage, 'Fruiting');
      expect(assessment.riskLevel, 'High');
      expect(assessment.primaryIndicator, 'Thrips Infestation');
      expect(assessment.potentialStressFactors, contains('Chili Thrips'));
      expect(assessment.recommendedActions.length, 2);
      expect(assessment.status, 'PendingApproval');
    });

    test('CropAnalysisAssessment.fromJson handles raw JSON string for lists', () {
      final json = {
        'id': 'diag-78',
        'workflowId': 'wf-9989',
        'fieldId': 'field-plot-1',
        'cropVariety': 'Paddy',
        'growthStage': 'Vegetative',
        'observationText': 'Spindle lesions on blades',
        'potentialStressFactorsJson': '["Pyricularia oryzae", "High Nitrogen"]',
        'recommendedActionsJson': '["Apply fungicide"]',
        'riskLevel': 'Critical',
        'status': 'Approved',
        'createdAt': '2026-10-05T11:00:00.000Z',
      };

      final assessment = CropAnalysisAssessment.fromJson(json);

      expect(assessment.potentialStressFactors, contains('Pyricularia oryzae'));
      expect(assessment.recommendedActions, contains('Apply fungicide'));
      expect(assessment.riskLevel, 'Critical');
    });
  });
}
