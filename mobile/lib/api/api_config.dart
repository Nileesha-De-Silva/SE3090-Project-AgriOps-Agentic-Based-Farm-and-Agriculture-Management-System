import 'package:flutter/foundation.dart';

class ApiConfig {
  /// Default base URL for ASP.NET Core unified backend on port 5286.
  /// On Android emulator, 10.0.2.2 maps to the host machine's localhost.
  /// On Web/Desktop, localhost works directly.
  static String baseUrl = kIsWeb
      ? 'http://localhost:5286/api'
      : (defaultTargetPlatform == TargetPlatform.android
          ? 'http://10.0.2.2:5286/api'
          : 'http://localhost:5286/api');
}
