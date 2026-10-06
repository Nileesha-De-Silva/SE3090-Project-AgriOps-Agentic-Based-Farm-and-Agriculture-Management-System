import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api.dart';
import 'api/api_config.dart';

// A single ChangeNotifier owns server snapshots and blocks overlapping operations.
// It deliberately does not cache or fabricate offline business data.
class Workspace extends ChangeNotifier {
  final Api api;
  final FlutterSecureStorage storage;
  Workspace(this.api, {this.storage = const FlutterSecureStorage()});
  bool connected = false, busy = false, stale = true;
  String? error;
  List<Record> items = [], suppliers = [], recommendations = [], purchases = [];
  Record? run;
  Record? runRequest;
  String? _owner;
  String get tokenKey => 'agriops.session.${api.base}';
  String get runKey => 'agriops.run.${api.base}.$_owner';
  bool canManage = false, canUse = false, canReceive = false;
  bool get canWrite => connected && !busy && !stale && canUse;
  Future<bool> login(String username, String password) => perform(() async {
    api.clearToken();
    ApiConfig.authToken = null;
    connected = false; stale = true;
    canManage = false; canUse = false; canReceive = false;
    items = []; suppliers = []; recommendations = []; purchases = [];
    final result = await api.request('auth/login', method: 'POST', login: true,
        body: {'username': username.trim(), 'password': password}) as Map;
    final token = result['token'];
    if (token is! String || token.isEmpty) throw const ApiFailure('Invalid login response.');
    api.setToken(token);
    await _verifyAndRestoreRun();
    await storage.write(key: tokenKey, value: token);
    ApiConfig.authToken = token;
    connected = true;
    await _load();
  });

  Future<bool> perform(Future<void> Function() action) async {
    if (busy) return false;
    busy = true;
    error = null;
    notifyListeners();
    try {
      await action();
      return true;
    } catch (e) {
      error = e is ApiFailure ? e.message : 'Operation failed. Check your connection and try refreshing.';
      if (e is ApiFailure && e.uncertain) stale = true;
      if (e is ApiFailure && (e.status == 401 || e.status == 403)) {
        connected = false;
        api.clearToken();
        ApiConfig.authToken = null;
        items = []; suppliers = []; recommendations = []; purchases = [];
        run = null; runRequest = null;
        try { await storage.delete(key: tokenKey); } catch (_) { /* Memory credentials are already cleared. */ }
      }
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> restore() async {
    await perform(() async {
      final token = await storage.read(key: tokenKey);
      if (token == null) return;
      api.setToken(token);
      await _verifyAndRestoreRun();
      connected = true;
      await _load();
    });
  }

  Future<bool> connect(String token) => perform(() async {
    api.setToken(token);
    await _verifyAndRestoreRun();
    await storage.write(key: tokenKey, value: token.trim());
    connected = true;
    await _load();
  });

  Future<void> _verifyAndRestoreRun() async {
    final identity = await api.request('inventory/session') as Map;
    if (identity['issuer'] is! String || identity['subject'] is! String ||
        (identity['issuer'] as String).isEmpty || (identity['subject'] as String).isEmpty) {
      throw const ApiFailure('The backend did not return a verified manager identity.', status: 401);
    }
    canManage = identity['canManage'] == true;
    canUse = identity['canUse'] == true;
    canReceive = identity['canReceive'] == true;
    _owner = jsonEncode([identity['issuer'], identity['subject']]);
    final saved = canManage ? await storage.read(key: runKey) : null;
    runRequest = saved == null ? null : Map<String, dynamic>.from(jsonDecode(saved) as Map);
    run = null;
  }

  Future<void> _load() async {
    stale = true;
    final values = await Future.wait(['inventory', 'suppliers', if (canManage) ...['reorder-recommendations', 'purchase-requests']].map(api.list));
    items = values[0]; suppliers = values[1]; recommendations = canManage ? values[2] : []; purchases = canManage ? values[3] : [];
    stale = false;
  }
  Future<bool> refresh() => perform(_load);
  Future<bool> movement(String id, String type, String quantity, String notes) => perform(() async {
    if (!connected || (type == 'Receive' ? !canReceive : !canUse)) throw const ApiFailure('You cannot record this stock movement.', status: 403);
    if (stale) throw const ApiFailure('Refresh before recording stock.');
    if (quantityError(quantity) != null || !['Use', 'Receive'].contains(type) || notes.length > 500) {
      throw const ApiFailure('Check the movement type, quantity and notes.');
    }
    await api.request('inventory/$id/transactions', method: 'POST', body: {
      'transactionType': type, 'quantity': double.parse(quantity), 'notes': notes.trim(),
    });
    // Once accepted, never offer an automatic retry, even if this refresh fails.
    stale = true;
    try { await _load(); } catch (e) {
      if (e is ApiFailure && (e.status == 401 || e.status == 403)) rethrow;
      throw const ApiFailure('Stock recorded, but refresh failed. Refresh and check history; do not submit again.', uncertain: true);
    }
  });
  Future<bool> startRun(Record input) => perform(() async {
    if (!canManage) throw const ApiFailure('Manager permission required.', status: 403);
    if (!connected || stale) throw const ApiFailure('Connect and refresh before asking the agent.');
    if (runRequest != null) throw const ApiFailure('Check the existing run before starting another.');
    runRequest = Map.of(input);
    run = null;
    await storage.write(key: runKey, value: jsonEncode(runRequest));
    run = Map<String, dynamic>.from(await api.request('inventory-agent/recommend', method: 'POST', body: runRequest) as Map);
  });
  Future<bool> checkRun({bool resume = false}) => perform(() async {
    if (!canManage) throw const ApiFailure('Manager permission required.', status: 403);
    final id = runRequest?['request_id'];
    if (id == null) return;
    run = Map<String, dynamic>.from(await api.request('inventory-agent/runs/$id${resume ? '/resume' : ''}', method: resume ? 'POST' : 'GET') as Map);
    await _load();
  });
  Future<bool> retrySameRun() => perform(() async {
    if (!canManage) throw const ApiFailure('Manager permission required.', status: 403);
    if (runRequest == null) return;
    run = Map<String, dynamic>.from(await api.request('inventory-agent/recommend', method: 'POST', body: runRequest) as Map);
  });
  Future<bool> newRun() => perform(() async {
    if (!canManage) throw const ApiFailure('Manager permission required.', status: 403);
    await storage.delete(key: runKey);
    runRequest = null; run = null;
  });
  Future<bool> disconnect() => perform(() async {
    api.clearToken(); ApiConfig.authToken = null; connected = false; stale = true;
    canManage = false; canUse = false; canReceive = false;
    items = []; suppliers = []; recommendations = []; purchases = [];
    run = null; runRequest = null;
    await storage.delete(key: tokenKey);
  });
  @override
  void dispose() { api.dispose(); super.dispose(); }
}
