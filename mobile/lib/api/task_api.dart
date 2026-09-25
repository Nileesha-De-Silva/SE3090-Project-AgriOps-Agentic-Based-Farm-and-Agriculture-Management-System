import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import '../models/farm_task.dart';

class TaskApi {
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

  static Future<List<FarmTask>> getTasks({
    String? status,
    String? priority,
    String? fieldId,
    String? workerId,
  }) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (priority != null && priority.isNotEmpty) queryParams['priority'] = priority;
    if (fieldId != null && fieldId.isNotEmpty) queryParams['fieldId'] = fieldId;
    if (workerId != null && workerId.isNotEmpty) queryParams['workerId'] = workerId;

    final uri = Uri.parse('$baseUrl/tasks').replace(
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final res = await http.get(uri);
    final list = await _handleResponseList(res);
    return list.map((json) => FarmTask.fromJson(json as Map<String, dynamic>)).toList();
  }

  static Future<FarmTask> getTaskById(String id) async {
    final res = await http.get(Uri.parse('$baseUrl/tasks/$id'));
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<FarmTask> createTask({
    required String fieldId,
    String? cropSeasonId,
    required String taskType,
    required String priority,
    required String description,
    required DateTime targetDate,
  }) async {
    final payload = {
      'fieldId': fieldId,
      if (cropSeasonId != null && cropSeasonId.isNotEmpty) 'cropSeasonId': cropSeasonId,
      'taskType': taskType,
      'priority': priority,
      'description': description,
      'targetDate': targetDate.toIso8601String(),
    };

    final res = await http.post(
      Uri.parse('$baseUrl/tasks'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<FarmTask> updateTaskStatus(
    String id,
    String newStatus, {
    String? remarks,
    String? userId,
  }) async {
    final payload = {
      'newStatus': newStatus,
      'remarks': remarks,
      'userId': userId,
    };

    final res = await http.patch(
      Uri.parse('$baseUrl/tasks/$id/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<TaskHistoryItem> submitEvidence(
    String id, {
    required String evidencePhotoUrl,
    String? remarks,
    String? workerUserId,
  }) async {
    final payload = {
      'evidencePhotoUrl': evidencePhotoUrl,
      'remarks': remarks ?? 'Photo evidence submitted from mobile app',
      'workerUserId': workerUserId,
    };

    final res = await http.post(
      Uri.parse('$baseUrl/tasks/$id/evidence'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return TaskHistoryItem.fromJson(data);
  }

  static Future<FarmTask> verifyEvidence(
    String id, {
    required bool isApproved,
    String? remarks,
    String? managerUserId,
  }) async {
    final payload = {
      'isApproved': isApproved,
      'remarks': remarks,
      'managerUserId': managerUserId,
    };

    final res = await http.post(
      Uri.parse('$baseUrl/tasks/$id/verify'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<List<TaskHistoryItem>> getTaskHistory(String id) async {
    final res = await http.get(Uri.parse('$baseUrl/tasks/$id/history'));
    final list = await _handleResponseList(res);
    return list.map((json) => TaskHistoryItem.fromJson(json as Map<String, dynamic>)).toList();
  }
}
