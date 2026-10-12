import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/api/api_config.dart';
import 'package:agriops_mobile/workspace.dart';
http.Response reply(dynamic data) => http.Response(jsonEncode(data), 200, headers: {'content-type': 'application/json'});
void main() {
  setUp(() { FlutterSecureStorage.setMockInitialValues({}); ApiConfig.clearSession(); });
  test('changing backend replaces a shared workspace connection and requires fresh login', () async {
    final paths = <Uri>[];
    final original = Api('https://old.example/api/', client: MockClient((_) async => reply([])));
    original.setToken('old-token');
    final ws = Workspace(original)..connected = true..canManage = true..canUse = true..stale = false;
    ws.items = [{'id': 'old-item'}]; ws.runRequest = {'request_id': 'old-run'};
    ApiConfig.setSession(token: 'old-token', username: 'old-user');
    final replacement = Api('http://10.0.2.2:5286/api/', allowLocalHttp: true, client: MockClient((r) async {
      paths.add(r.url);
      if (r.url.path.endsWith('/auth/login')) {
        expect(r.headers['Authorization'], isNull);
        return reply({'token': 'new-token', 'roles': ['FarmManager']});
      }
      expect(r.headers['Authorization'], 'Bearer new-token');
      if (r.url.path.endsWith('/session')) return reply({'issuer': 'local', 'subject': 'manager', 'canManage': true, 'canUse': true, 'canReceive': true});
      if (r.url.path.endsWith('/inventory')) return reply([{'id': 'local-item'}]);
      return reply([]);
    }));
    ws.changeBackend(replacement);
    expect(ws.api.base.host, '10.0.2.2'); expect(ws.connected, false); expect(ws.items, isEmpty);
    expect(ws.runRequest, isNull); expect(ApiConfig.authToken, isNull);
    expect(ApiConfig.baseUrl, 'http://10.0.2.2:5286/api');
    expect(await ws.login('farm_manager', 'test-password'), true);
    expect(ws.items.single['id'], 'local-item'); expect(paths.every((p) => p.host == '10.0.2.2' && p.port == 5286), true);
    ws.dispose();
  });
  test('cannot switch a backend while an operation is running', () {
    final ws = Workspace(Api('https://old.example/api/'))..busy = true;
    final replacement = Api('https://new.example/api/');
    expect(() => ws.changeBackend(replacement), throwsStateError);
    expect(ws.api.base.host, 'old.example');
    replacement.dispose(); ws.dispose();
  });
}
