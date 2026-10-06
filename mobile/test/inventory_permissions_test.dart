import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/workspace.dart';
import 'package:agriops_mobile/screens.dart';

http.Response json(dynamic value) => http.Response(jsonEncode(value), 200, headers: {'content-type': 'application/json'});
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));
  test('worker login uses shared endpoint and does not fetch manager records', () async {
    final paths = <String>[];
    var writes = 0;
    final w = Workspace(Api('https://farm.example/api/', client: MockClient((r) async {
      paths.add(r.url.path);
      if (r.url.path.endsWith('/auth/login')) {
        expect(r.headers['Authorization'], isNull);
        expect(jsonDecode(r.body)['password'], ' password with spaces ');
        return json({'token': 'worker-session'});
      }
      if (r.url.path.endsWith('/session')) return json({'subject': 'worker', 'issuer': 'farm', 'canManage': false, 'canUse': true, 'canReceive': false});
      if (r.method == 'POST') { writes++; return json({'id': 'movement'}); }
      return json([]);
    })));
    expect(await w.login('worker', ' password with spaces '), true);
    expect(paths.any((p) => p.contains('purchase-requests') || p.contains('reorder-recommendations')), false);
    expect(await w.movement('item', 'Use', '1', ''), true);
    expect(writes, 1);
    expect(await w.movement('item', 'Receive', '1', ''), false);
    expect(writes, 1);
    w.dispose();
  });
  testWidgets('farmer sees history but no stock movement form', (tester) async {
    final w = Workspace(Api('https://farm.example/api/', client: MockClient((r) async => json([]))))
      ..connected = true ..stale = false
      ..items = [{'id':'item', 'name':'Seed', 'currentStock':2, 'unitOfMeasurement':'kg'}];
    w.api.setToken('farmer');
    await tester.pumpWidget(MaterialApp(home: ItemScreen(workspace: w, itemId: 'item')));
    await tester.pumpAndSettle();
    expect(find.text('Stock history'), findsOneWidget);
    expect(find.text('Record movement'), findsNothing);
    await tester.pumpWidget(const SizedBox());
    w.dispose();
  });
}
