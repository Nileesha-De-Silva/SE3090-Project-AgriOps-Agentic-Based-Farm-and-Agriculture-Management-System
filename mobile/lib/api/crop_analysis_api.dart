import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import '../models/crop_analysis_assessment.dart';
import '../models/farm_task.dart';

class CropAnalysisApi {
  static String get baseUrl => ApiConfig.baseUrl;

  static Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body);
    }
    String message = 'Request failed with status ${response.statusCode}';
    try {
      final body = jsonDecode(response.body);
      message = body['message'] ?? body['title'] ?? response.body;
    } catch (_) {}
    throw Exception(message);
  }

  static Future<List<dynamic>> _handleResponseList(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('Request failed with status ${response.statusCode}: ${response.body}');
  }

  static Future<CropAnalysisAssessment> submitCropAnalysis({
    required String fieldId,
    required String cropVariety,
    required String growthStage,
    required String observationText,
    String? imageUrl,
    String? submittedByUserId,
  }) async {
    final payload = {
      'fieldId': fieldId,
      'cropVariety': cropVariety,
      'growthStage': growthStage,
      'observationText': observationText,
      if (imageUrl != null && imageUrl.isNotEmpty) 'imageUrl': imageUrl,
      if (submittedByUserId != null) 'submittedByUserId': submittedByUserId,
    };

    final res = await http.post(
      Uri.parse('$baseUrl/cropanalysis'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return CropAnalysisAssessment.fromJson(data);
  }

  static Future<CropAnalysisAssessment> getAssessmentById(String id) async {
    final res = await http.get(Uri.parse('$baseUrl/cropanalysis/$id'));
    final data = await _handleResponse(res);
    return CropAnalysisAssessment.fromJson(data);
  }

  static Future<List<CropAnalysisAssessment>> getPendingApprovals() async {
    final res = await http.get(Uri.parse('$baseUrl/cropanalysis/pending'));
    final list = await _handleResponseList(res);
    return list.map((json) => CropAnalysisAssessment.fromJson(json as Map<String, dynamic>)).toList();
  }

  static Future<FarmTask> approveAssessment(
    String id, {
    String? comments,
    String? managerUserId,
  }) async {
    final payload = {
      'comments': comments ?? 'Approved via AgriOps Mobile',
      if (managerUserId != null) 'managerUserId': managerUserId,
    };

    final res = await http.post(
      Uri.parse('$baseUrl/cropanalysis/$id/approve'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<void> rejectAssessment(
    String id, {
    String? comments,
    String? managerUserId,
  }) async {
    final payload = {
      'comments': comments ?? 'Rejected via AgriOps Mobile',
      if (managerUserId != null) 'managerUserId': managerUserId,
    };

    final res = await http.post(
      Uri.parse('$baseUrl/cropanalysis/$id/reject'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    await _handleResponse(res);
  }
}
