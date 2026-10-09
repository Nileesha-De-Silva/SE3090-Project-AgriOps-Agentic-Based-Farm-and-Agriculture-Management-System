import 'dart:convert';
import 'package:http/http.dart' as http;

typedef Record = Map<String, dynamic>;

class ApiFailure implements Exception {
  final String message;
  final int? status;
  final bool uncertain;
  const ApiFailure(this.message, {this.status, this.uncertain = false});
  @override
  String toString() => message;
}

class Api {
  final Uri base;
  final http.Client client;
  String _token = '';
  Api(String address, {http.Client? client, bool allowLocalHttp = false})
      : base = Uri.parse(address), client = client ?? http.Client() {
    final local = ['localhost', '127.0.0.1', '10.0.2.2'].contains(base.host);
    if (!(base.scheme == 'https' || (allowLocalHttp && local && base.scheme == 'http')) ||
        base.userInfo.isNotEmpty || base.hasQuery || base.hasFragment || base.path != '/api/') {
      throw ArgumentError('Use an HTTPS ASP.NET Core URL ending in /api/. Local HTTP is debug-only.');
    }
  }
  void setToken(String token) => _token = token.trim();
  void clearToken() => _token = '';
  void dispose() => client.close();

  Future<dynamic> request(String path, {String method = 'GET', Record? body, bool login = false, bool allowAnonymous = false}) async {
    final isAnonymous = login || allowAnonymous || path == 'auth/login' || path == 'auth/register';
    if (!isAnonymous && _token.isEmpty) throw const ApiFailure('Connect with a valid session first.', status: 401);
    final target = base.resolve(path);
    if (target.origin != base.origin || !target.path.startsWith(base.path)) {
      throw ArgumentError('Requests must stay inside the configured API.');
    }
    final write = method != 'GET';
    final request = http.Request(method, target)
      ..followRedirects = false
      ..headers.addAll({if (!isAnonymous) 'Authorization': 'Bearer $_token', 'Accept': 'application/json'});
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    try {
      final response = await client.send(request).then(http.Response.fromStream)
          .timeout(const Duration(seconds: 120));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final message = switch (response.statusCode) {
          401 => 'Session expired. Disconnect and connect again.',
          403 => 'Your account does not have permission for this action.',
          404 => 'Record or run not found.',
          409 => 'Data changed or a recommendation already exists. Refresh before continuing.',
          400 || 422 => 'Check your input. The server rejected this request.',
          _ => 'Server unavailable. Check the connection and refresh.',
        };
        throw ApiFailure(message, status: response.statusCode, uncertain: write && response.statusCode >= 500);
      }
      if (response.statusCode == 204) return null;
      if (!(response.headers['content-type'] ?? '').contains('application/json')) {
        throw ApiFailure('The server did not return API data.', uncertain: write);
      }
      return jsonDecode(response.body);
    } on ApiFailure {
      rethrow;
    } catch (_) {
      throw ApiFailure(write ? 'Result unknown. Check history or the same run ID before retrying.' : 'Could not load data. Check your connection.', uncertain: write);
    }
  }

  Future<List<Record>> list(String path) async => (await request(path) as List).map((e) => Map<String, dynamic>.from(e as Map)).toList();
}

String? itemIdFromCode(String text) {
  final value = text.trim().replaceFirst(RegExp(r'^agriops:item:'), '');
  return RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$').hasMatch(value) ? value.toLowerCase() : null;
}

String? quantityError(String? value) {
  final text = (value ?? '').trim();
  if (!RegExp(r'^\d{1,8}(\.\d{1,2})?$').hasMatch(text) || (double.tryParse(text) ?? 0) <= 0) {
    return 'Enter a positive amount with at most 2 decimal places.';
  }
  return null;
}

String amount(dynamic value) => (num.tryParse('$value') ?? 0).toStringAsFixed(2);
