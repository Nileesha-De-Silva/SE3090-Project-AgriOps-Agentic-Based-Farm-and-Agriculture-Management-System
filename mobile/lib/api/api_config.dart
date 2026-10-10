class ApiConfig {
  /// Production base URL pointing to live Render backend
  static String baseUrl = 'https://agriops-backend-api.onrender.com/api';
  /// Active JWT token for authenticated operations
  static String? authToken;
  static String? currentUsername;
  static String? currentFullName;
  static List<String> currentRoles = [];

  static bool get isAuthenticated => authToken != null && authToken!.isNotEmpty;
  static String get primaryRole => currentRoles.isNotEmpty ? currentRoles.first : 'Guest';

  static void setSession({
    required String token,
    required String username,
    String? fullName,
    List<String>? roles,
  }) {
    authToken = token.trim();
    currentUsername = username.trim();
    currentFullName = (fullName != null && fullName.trim().isNotEmpty) ? fullName.trim() : username.trim();
    currentRoles = roles ?? [];
  }

  static void clearSession() {
    authToken = null;
    currentUsername = null;
    currentFullName = null;
    currentRoles = [];
  }

  static Map<String, String> get authHeaders => {
        'Content-Type': 'application/json',
        if (authToken != null && authToken!.isNotEmpty)
          'Authorization': 'Bearer $authToken',
      };
  
}

