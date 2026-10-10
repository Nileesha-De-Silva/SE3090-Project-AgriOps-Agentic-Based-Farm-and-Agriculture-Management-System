import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import '../models/farm_task.dart';

class TaskApi {
  static String get baseUrl => ApiConfig.baseUrl;

  static String get _cleanBaseUrl =>
      baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (ApiConfig.authToken != null && ApiConfig.authToken!.isNotEmpty)
          'Authorization': 'Bearer ${ApiConfig.authToken}',
      };

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
    http.Client? client,
  }) async {
    final queryParams = <String, String>{};
    if (status != null && status.isNotEmpty) queryParams['status'] = status;
    if (priority != null && priority.isNotEmpty) queryParams['priority'] = priority;
    if (fieldId != null && fieldId.isNotEmpty) queryParams['fieldId'] = fieldId;
    if (workerId != null && workerId.isNotEmpty) queryParams['workerId'] = workerId;

    final uri = Uri.parse('$_cleanBaseUrl/tasks').replace(
      queryParameters: queryParams.isNotEmpty ? queryParams : null,
    );

    final httpClient = client ?? http.Client();
    final res = await httpClient.get(uri, headers: _headers);
    final list = await _handleResponseList(res);
    return list.map((json) => FarmTask.fromJson(json as Map<String, dynamic>)).toList();
  }

  static Future<FarmTask> getTaskById(String id, {http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.get(Uri.parse('$_cleanBaseUrl/tasks/$id'), headers: _headers);
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
    http.Client? client,
  }) async {
    final payload = {
      'fieldId': fieldId,
      if (cropSeasonId != null && cropSeasonId.isNotEmpty) 'cropSeasonId': cropSeasonId,
      'taskType': taskType,
      'priority': priority,
      'description': description,
      'targetDate': targetDate.toIso8601String(),
    };

    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$_cleanBaseUrl/tasks'),
      headers: _headers,
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
    http.Client? client,
  }) async {
    final effectiveUserId = (userId != null && userId.trim().isNotEmpty)
        ? userId.trim()
        : '00000000-0000-0000-0000-000000000000';

    final payload = {
      'newStatus': newStatus,
      'remarks': remarks ?? 'Status updated to $newStatus',
      'userId': effectiveUserId,
    };

    final httpClient = client ?? http.Client();
    final res = await httpClient.patch(
      Uri.parse('$_cleanBaseUrl/tasks/$id/status'),
      headers: _headers,
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
    http.Client? client,
  }) async {
    final effectiveWorkerId = (workerUserId != null && workerUserId.trim().isNotEmpty)
        ? workerUserId.trim()
        : '00000000-0000-0000-0000-000000000000';

    final payload = {
      'evidencePhotoUrl': evidencePhotoUrl,
      'remarks': remarks ?? 'Photo evidence submitted from mobile app',
      'workerUserId': effectiveWorkerId,
    };

    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$_cleanBaseUrl/tasks/$id/evidence'),
      headers: _headers,
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
    http.Client? client,
  }) async {
    final effectiveManagerId = (managerUserId != null && managerUserId.trim().isNotEmpty)
        ? managerUserId.trim()
        : '00000000-0000-0000-0000-000000000000';

    final payload = {
      'isApproved': isApproved,
      'remarks': remarks ?? (isApproved ? 'Approved by manager' : 'Rejected by manager'),
      'managerUserId': effectiveManagerId,
    };

    final httpClient = client ?? http.Client();
    final res = await httpClient.post(
      Uri.parse('$_cleanBaseUrl/tasks/$id/verify'),
      headers: _headers,
      body: jsonEncode(payload),
    );
    final data = await _handleResponse(res);
    return FarmTask.fromJson(data);
  }

  static Future<List<TaskHistoryItem>> getTaskHistory(String id, {http.Client? client}) async {
    final httpClient = client ?? http.Client();
    final res = await httpClient.get(Uri.parse('$_cleanBaseUrl/tasks/$id/history'), headers: _headers);
    final list = await _handleResponseList(res);
    return list.map((json) => TaskHistoryItem.fromJson(json as Map<String, dynamic>)).toList();
  }
}
