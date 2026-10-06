import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api/analytics_api.dart';
import 'package:agriops_mobile/api/api_config.dart';

void main() {
  group('Analytics API & Sentinel Model Unit Tests (Component 4)', () {
    test('SeasonYield.fromJson deserializes correctly', () {
      final json = {
        'fieldId': 'field-101',
        'fieldName': 'North Valley',
        'cropSeasonId': 'season-202',
        'seasonName': 'Yala 2026',
        'startDate': '2026-05-01T00:00:00Z',
        'cropName': 'Paddy',
        'totalYield': 4500.5,
      };

      final yieldRecord = SeasonYield.fromJson(json);
      expect(yieldRecord.fieldId, 'field-101');
      expect(yieldRecord.fieldName, 'North Valley');
      expect(yieldRecord.cropName, 'Paddy');
      expect(yieldRecord.totalYield, 4500.5);
    });

    test('SentinelReport.fromJson deserializes with anomalies and human approval gate', () {
      final json = {
        'run_id': 'run-sentinel-1',
        'status': 'awaiting_approval',
        'yield_performance_score': 58.5,
        'overall_risk_level': 'HIGH',
        'anomalies': [
          {
            'anomaly_type': 'YIELD_DEFICIT',
            'severity': 'HIGH',
            'metric': 'SeasonalYieldKg',
            'observed_value': 600.0,
            'expected_value': 1100.0,
            'variance_percent': -45.45,
            'description': 'Yield deficit detected',
          }
        ],
        'remediation': {
          'proposed_task_type': 'SoilInspection',
          'priority': 'High',
          'action_summary': 'Emergency soil test',
          'justification': '45% deficit requires soil audit',
        },
        'strategic_commentary': 'High risk identified due to significant seasonal drop.',
        'requires_human_approval': true,
        'approval_status': 'pending_approval',
        'trace': [{'step': 'analyze_metrics', 'outcome': 'ok'}],
      };

      final report = SentinelReport.fromJson(json);
      expect(report.runId, 'run-sentinel-1');
      expect(report.status, 'awaiting_approval');
      expect(report.overallRiskLevel, 'HIGH');
      expect(report.requiresHumanApproval, true);
      expect(report.anomalies.length, 1);
      expect(report.remediation?['proposed_task_type'], 'SoilInspection');
    });

    test('getHarvestYields fetches list of seasonal yields via HTTP mock', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/analytics/harvest-yields');
        return http.Response(
          jsonEncode([
            {
              'fieldId': 'f1',
              'fieldName': 'Plot A',
              'cropSeasonId': 's1',
              'seasonName': 'Maha',
              'startDate': '2026-01-01',
              'cropName': 'Corn',
              'totalYield': 1200.0,
            }
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final yields = await AnalyticsApi.getHarvestYields(client: client);
      expect(yields.length, 1);
      expect(yields.first.cropName, 'Corn');
      expect(yields.first.totalYield, 1200.0);
    });

    test('runSentinelAudit initiates Sentinel run and returns report', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/analytics-agent/analyze');
        return http.Response(
          jsonEncode({
            'run_id': 'test-run-123',
            'status': 'completed',
            'yield_performance_score': 85.0,
            'overall_risk_level': 'LOW',
            'anomalies': [],
            'strategic_commentary': 'Farm operations running consistently.',
            'requires_human_approval': false,
            'approval_status': 'not_required',
            'trace': [],
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final report = await AnalyticsApi.runSentinelAudit(client: client);
      expect(report.runId, 'test-run-123');
      expect(report.overallRiskLevel, 'LOW');
      expect(report.requiresHumanApproval, false);
    });

    test('login authenticates manager and sets ApiConfig.authToken', () async {
      final client = MockClient((request) async {
        expect(request.url.path, '/api/auth/login');
        return http.Response(
          jsonEncode({
            'token': 'mock-jwt-token-xyz',
            'username': 'admin',
            'role': 'Administrator',
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final success = await AnalyticsApi.login('admin', 'ChangeMe123!', client: client);
      expect(success, true);
      expect(ApiConfig.authToken, 'mock-jwt-token-xyz');
    });
  });
}
