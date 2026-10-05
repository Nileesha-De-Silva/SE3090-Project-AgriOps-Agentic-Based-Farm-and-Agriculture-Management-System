import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api.dart';

void main() {
  test('requires HTTPS except explicitly enabled local debug addresses', () {
    expect(() => Api('http://example.com/api/', allowLocalHttp: true), throwsArgumentError);
    expect(() => Api('http://10.0.2.2:5289/api/'), throwsArgumentError);
    expect(() => Api('https://user:secret@example.com/api/'), throwsArgumentError);
    expect(() => Api('https://example.com/api/?token=x'), throwsArgumentError);
    final api = Api('http://10.0.2.2:5289/api/', allowLocalHttp: true);
    api.dispose();
  });
  test('never sends a protected request without a token', () async {
    var calls = 0;
    final api = Api('https://farm.example/api/', client: MockClient((_) async { calls++; return http.Response('{}', 200); }));
    await expectLater(api.request('inventory'), throwsA(isA<ApiFailure>().having((e) => e.status, 'status', 401)));
    expect(calls, 0);
    api.dispose();
  });
  test('agent calls only ASP.NET Core and retains request ID and current token', () async {
    final requests = <http.Request>[];
    final api = Api('https://farm.example/api/', client: MockClient((r) async {
      requests.add(r); return http.Response('{"status":"awaiting_approval"}', 200, headers: {'content-type':'application/json'});
    }));
    api.setToken('manager-one');
    final body = {'request_id':'fixed-run', 'inventory_item_id':'item', 'message':'Prefer fast delivery'};
    await api.request('inventory-agent/recommend', method: 'POST', body: body);
    api.setToken('manager-two');
    await api.request('inventory-agent/recommend', method: 'POST', body: body);
    expect(requests[0].url.toString(), 'https://farm.example/api/inventory-agent/recommend');
    expect(requests[0].body, requests[1].body);
    expect(requests[1].headers['Authorization'], 'Bearer manager-two');
    expect(requests[0].followRedirects, false);
    api.dispose();
  });
  test('uncertain writes are not retried and raw provider errors are not shown', () async {
    var calls = 0;
    final api = Api('https://farm.example/api/', client: MockClient((_) async { calls++; return http.Response('private provider details', 502); }));
    api.setToken('manager');
    await expectLater(api.request('inventory/item/transactions', method: 'POST', body: {'quantity': 5}),
      throwsA(isA<ApiFailure>().having((e) => e.uncertain, 'uncertain', true).having((e) => e.message.contains('private'), 'scrubbed', false)));
    expect(calls, 1);
    api.dispose();
  });
  test('rejects HTML fallback and external paths', () async {
    final api = Api('https://farm.example/api/', client: MockClient((_) async => http.Response('<html>app</html>', 200, headers: {'content-type': 'text/html'})));
    api.setToken('manager');
    await expectLater(api.request('inventory'), throwsA(isA<ApiFailure>()));
    await expectLater(api.request('https://other.example/api/'), throwsArgumentError);
    api.dispose();
  });
  test('stock request keeps decimal quantity and notes', () async {
    final api = Api('https://farm.example/api/', client: MockClient((r) async {
      final body = jsonDecode(r.body) as Map;
      expect(body['quantity'], 1.25); expect(body['transactionType'], 'Use');
      return http.Response('{}', 201, headers: {'content-type': 'application/json'});
    }));
    api.setToken('manager');
    await api.request('inventory/id/transactions', method: 'POST', body: {'quantity': 1.25, 'transactionType': 'Use', 'notes':'Field A'});
    api.dispose();
  });
  test('QR accepts item IDs only, never arbitrary URLs', () {
    const id = '00000000-0000-4000-8000-000000000001';
    expect(itemIdFromCode('agriops:item:$id'), id);
    expect(itemIdFromCode(id), id);
    expect(itemIdFromCode('https://attacker.example/$id'), isNull);
    expect(itemIdFromCode('bad-code'), isNull);
  });
  test('amounts reject excessive precision, negatives and invalid input', () {
    for (final value in ['0', '-1', '1.234', 'NaN', '1e4', '100000000', '']) {
      expect(quantityError(value), isNotNull);
    }
    expect(quantityError('1.25'), isNull);
    expect(amount('1.2'), '1.20');
  });
}
