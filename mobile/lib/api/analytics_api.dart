import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class SeasonYield {
  final String fieldId;
  final String fieldName;
  final String cropSeasonId;
  final String seasonName;
  final String startDate;
  final String cropName;
  final double totalYield;

  SeasonYield({
    required this.fieldId,
    required this.fieldName,
    required this.cropSeasonId,
    required this.seasonName,
    required this.startDate,
    required this.cropName,
    required this.totalYield,
  });

  factory SeasonYield.fromJson(Map<String, dynamic> json) {
    return SeasonYield(
      fieldId: json['fieldId']?.toString() ?? '',
      fieldName: json['fieldName']?.toString() ?? '',
      cropSeasonId: json['cropSeasonId']?.toString() ?? '',
      seasonName: json['seasonName']?.toString() ?? '',
      startDate: json['startDate']?.toString() ?? '',
      cropName: json['cropName']?.toString() ?? '',
      totalYield: (json['totalYield'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class SentinelReport {
  final String runId;
  final String status;
  final double yieldPerformanceScore;
  final String overallRiskLevel;
  final List<dynamic> anomalies;
  final Map<String, dynamic>? remediation;
  final String strategicCommentary;
  final bool requiresHumanApproval;
  final String approvalStatus;
  final String? finalOutcome;
  final List<dynamic> trace;

  SentinelReport({
    required this.runId,
    required this.status,
    required this.yieldPerformanceScore,
    required this.overallRiskLevel,
    required this.anomalies,
    this.remediation,
    required this.strategicCommentary,
    required this.requiresHumanApproval,
    required this.approvalStatus,
    this.finalOutcome,
    required this.trace,
  });

  factory SentinelReport.fromJson(Map<String, dynamic> json) {
    return SentinelReport(
      runId: json['run_id']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      yieldPerformanceScore: (json['yield_performance_score'] as num?)?.toDouble() ?? 75.0,
      overallRiskLevel: json['overall_risk_level']?.toString() ?? 'LOW',
      anomalies: json['anomalies'] as List<dynamic>? ?? [],
      remediation: json['remediation'] as Map<String, dynamic>?,
      strategicCommentary: json['strategic_commentary']?.toString() ?? '',
      requiresHumanApproval: json['requires_human_approval'] as bool? ?? false,
      approvalStatus: json['approval_status']?.toString() ?? 'not_required',
      finalOutcome: json['final_outcome']?.toString(),
      trace: json['trace'] as List<dynamic>? ?? [],
    );
  }
}

class AnalyticsApi {
  static String get baseUrl => ApiConfig.baseUrl;

  static Future<List<SeasonYield>> getHarvestYields({http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.get(
      Uri.parse('$baseUrl/analytics/harvest-yields'),
      headers: ApiConfig.authHeaders,
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.map((e) => SeasonYield.fromJson(e as Map<String, dynamic>)).toList();
    }
    throw Exception('Failed to load harvest yields: ${res.statusCode}');
  }

  static Future<SentinelReport> runSentinelAudit({
    String? fieldId,
    String? cropName,
    http.Client? client,
  }) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$baseUrl/analytics-agent/analyze'),
      headers: ApiConfig.authHeaders,
      body: jsonEncode({
        if (fieldId != null) 'field_id': fieldId,
        if (cropName != null) 'crop_name': cropName,
        'sensitivity_threshold': 0.20,
        'audit_lookback_count': 50,
      }),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return SentinelReport.fromJson(jsonDecode(res.body));
    }
    throw Exception('Sentinel analysis failed: ${res.statusCode}');
  }

  static Future<SentinelReport> approveIntervention(String runId, String notes, {http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$baseUrl/analytics-agent/runs/$runId/approve'),
      headers: ApiConfig.authHeaders,
      body: jsonEncode({
        'action': 'approve',
        'manager_notes': notes,
      }),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return SentinelReport.fromJson(jsonDecode(res.body));
    }
    throw Exception('Approval failed: ${res.statusCode}');
  }

  static Future<SentinelReport> rejectIntervention(String runId, String notes, {http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$baseUrl/analytics-agent/runs/$runId/reject'),
      headers: ApiConfig.authHeaders,
      body: jsonEncode({
        'action': 'reject',
        'manager_notes': notes,
      }),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return SentinelReport.fromJson(jsonDecode(res.body));
    }
    throw Exception('Rejection failed: ${res.statusCode}');
  }

  static Future<bool> login(String username, String password, {http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (res.statusCode >= 200 && res.statusCode < 300) {
      final data = jsonDecode(res.body);
      ApiConfig.authToken = data['token'];
      return true;
    }
    return false;
  }
}
