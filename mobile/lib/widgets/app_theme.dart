import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryGreen = Color(0xFF285A48);
  static const Color secondaryGreen = Color(0xFF408A71);
  static const Color lightGreen = Color(0xFFB0E4CC);
  static const Color darkText = Color(0xFF091413);
  static const Color background = Color(0xFFF2FAF6);

  static ThemeData get theme {
    final scheme = ColorScheme.fromSeed(
      seedColor: primaryGreen,
      primary: primaryGreen,
      onPrimary: Colors.white,
      secondary: secondaryGreen,
      onSecondary: Colors.white,
      primaryContainer: lightGreen,
      onPrimaryContainer: darkText,
      secondaryContainer: lightGreen,
      onSecondaryContainer: darkText,
      surface: Colors.white,
      onSurface: darkText,
    );
    final base = ThemeData(useMaterial3: true, colorScheme: scheme, fontFamily: 'SourceSans3');
    final text = base.textTheme.apply(bodyColor: darkText, displayColor: darkText);
    return base.copyWith(
      primaryColor: primaryGreen,
      scaffoldBackgroundColor: background,
      textTheme: text.copyWith(
        displayLarge: text.displayLarge?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        displayMedium: text.displayMedium?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        displaySmall: text.displaySmall?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        headlineLarge: text.headlineLarge?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        headlineMedium: text.headlineMedium?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        headlineSmall: text.headlineSmall?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
        titleLarge: text.titleLarge?.copyWith(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: TextStyle(fontFamily: 'BricolageGrotesque', fontWeight: FontWeight.w700, fontSize: 22, color: Colors.white),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGreen,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: lightGreen,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
