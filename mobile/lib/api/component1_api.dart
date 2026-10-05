import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/farm.dart';
import '../models/field.dart';
import '../models/crop.dart';
import '../models/crop_season.dart';

class Component1Api {
  static const String baseUrl = 'http://192.168.1.15:5289/api';

  static Future<Map<String, dynamic>> _handleResponse(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return jsonDecode(response.body);
    }
    String message = 'Request failed with status ${response.statusCode}';
    try {
      final body = jsonDecode(response.body);
      message = body['message'] ?? body['title'] ?? message;
    } catch (_) {}
    throw Exception(message);
  }

  static Future<List<dynamic>> _handleResponseList(http.Response response) async {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body) as List<dynamic>;
    }
    throw Exception('Request failed with status ${response.statusCode}');
  }

  static Future<List<Farm>> getFarms() async {
    final res = await http.get(Uri.parse('$baseUrl/farm'));
    final data = await _handleResponseList(res);
    return data.map((json) => Farm.fromJson(json)).toList();
  }

  static Future<Farm> createFarm(Farm farm) async {
    final res = await http.post(
      Uri.parse('$baseUrl/farm'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(farm.toCreateJson()),
    );
    final data = await _handleResponse(res);
    return Farm.fromJson(data);
  }

  static Future<List<Field>> getFields({String? farmId}) async {
    final uri = farmId != null
        ? Uri.parse('$baseUrl/field?farmId=$farmId')
        : Uri.parse('$baseUrl/field');
    final res = await http.get(uri);
    final data = await _handleResponseList(res);
    return data.map((json) => Field.fromJson(json)).toList();
  }

  static Future<Field> createField(Field field) async {
    final res = await http.post(
      Uri.parse('$baseUrl/field'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(field.toCreateJson()),
    );
    final data = await _handleResponse(res);
    return Field.fromJson(data);
  }

  static Future<List<Crop>> getCrops() async {
    final res = await http.get(Uri.parse('$baseUrl/crop'));
    final data = await _handleResponseList(res);
    return data.map((json) => Crop.fromJson(json)).toList();
  }

  static Future<List<CropSeason>> getCropSeasons({String? fieldId}) async {
    final uri = fieldId != null
        ? Uri.parse('$baseUrl/cropseason?fieldId=$fieldId')
        : Uri.parse('$baseUrl/cropseason');
    final res = await http.get(uri);
    final data = await _handleResponseList(res);
    return data.map((json) => CropSeason.fromJson(json)).toList();
  }

  static Future<CropSeason> createCropSeason(CropSeason season) async {
    final res = await http.post(
      Uri.parse('$baseUrl/cropseason'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(season.toCreateJson()),
    );
    final data = await _handleResponse(res);
    return CropSeason.fromJson(data);
  }

  static Future<void> createPlanting(String cropSeasonId, Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$baseUrl/cropseason/$cropSeasonId/planting'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    await _handleResponse(res);
  }
}