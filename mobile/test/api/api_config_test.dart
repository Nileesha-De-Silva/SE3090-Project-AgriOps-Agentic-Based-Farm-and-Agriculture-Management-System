import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/api/api_config.dart';

void main() {
  group('ApiConfig Unit Tests', () {
    test('ApiConfig provides a valid default base URL for ASP.NET Core API', () {
      expect(ApiConfig.baseUrl, isNotEmpty);
      expect(ApiConfig.baseUrl, contains('/api'));
    });

    test('ApiConfig allows updating base URL dynamically', () {
      final original = ApiConfig.baseUrl;

      ApiConfig.baseUrl = 'http://192.168.1.100:5286/api';
      expect(ApiConfig.baseUrl, 'http://192.168.1.100:5286/api');

      // Restore
      ApiConfig.baseUrl = original;
    });
  });
}
