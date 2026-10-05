import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:agriops_mobile/api.dart';
import 'package:agriops_mobile/workspace.dart';

http.Response json(dynamic body, [int status = 200]) => http.Response(jsonEncode(body), status, headers: {'content-type':'application/json'});

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUp(() => FlutterSecureStorage.setMockInitialValues({}));
  test('uncertain agent run survives restart only for its verified owner', () async {
    final bodies = <String>[];
    Api client() => Api('https://farm.example/api/', client: MockClient((r) async {
      if (r.url.path.endsWith('/access')) return json({'issuer':'farm', 'subject':r.headers['Authorization']});
      if (r.method == 'POST') { bodies.add(r.body); return json({}, 502); }
      return json([]);
    }));
    final first = Workspace(client());
    expect(await first.connect('manager-one'), true);
    final input = {'request_id':'run-one','inventory_item_id':'item-one','message':'Prefer fast delivery','safety_days':7};
    expect(await first.startRun(input), false);
    first.dispose();
    final restored = Workspace(client());
    await restored.restore();
    expect(restored.connected, true);
    expect(restored.runRequest, input);
    await restored.retrySameRun();
    expect(bodies.length, 2);
    expect(bodies[0], bodies[1]);
    await restored.disconnect();
    expect(await restored.storage.read(key: restored.tokenKey), isNull);
    expect(await restored.connect('manager-two'), true);
    expect(restored.runRequest, isNull);
    restored.dispose();
  });
  test('accepted stock write with failed refresh is not submitted again', () async {
    var writes = 0;
    final workspace = Workspace(Api('https://farm.example/api/', client: MockClient((r) async {
      if (r.url.path.endsWith('/access')) return json({'issuer':'farm','subject':'manager'});
      if (r.method == 'POST') { writes++; return json({'id':'movement'}, 201); }
      return writes > 0 ? json({}, 503) : json([]);
    })));
    await workspace.connect('manager');
    expect(await workspace.movement('item', 'Use', '1.25', 'Field A'), false);
    expect(workspace.stale, true);
    expect(workspace.error, contains('Stock recorded'));
    await workspace.movement('item', 'Use', '1.25', 'Field A');
    expect(writes, 1);
    workspace.dispose();
  });
  test('expired session clears protected snapshots and stored token', () async {
    var expired = false;
    final workspace = Workspace(Api('https://farm.example/api/', client: MockClient((r) async {
      if (expired) return json({}, 401);
      if (r.url.path.endsWith('/access')) return json({'issuer':'farm','subject':'manager'});
      return json([]);
    })));
    await workspace.connect('manager');
    workspace.items = [{'name':'private item'}];
    expired = true;
    await workspace.refresh();
    expect(workspace.connected, false);
    expect(workspace.items, isEmpty);
    expect(await workspace.storage.read(key: workspace.tokenKey), isNull);
    workspace.dispose();
  });
  test('invalid movement never reaches API even if called outside the form', () async {
    var writes = 0;
    final workspace = Workspace(Api('https://farm.example/api/', client: MockClient((r) async {
      if (r.method == 'POST') writes++;
      if (r.url.path.endsWith('/access')) return json({'issuer':'farm','subject':'manager'});
      return json([]);
    })));
    await workspace.connect('manager');
    expect(await workspace.movement('item','Use','1.234',''), false);
    expect(await workspace.movement('item','Adjust','1',''), false);
    expect(writes, 0);
    workspace.dispose();
  });
}
