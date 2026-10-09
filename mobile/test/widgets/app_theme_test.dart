import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/widgets/app_theme.dart';

void main() {
  group('AppTheme Unit & Widget Tests', () {
    test('AppTheme provides correct brand colors', () {
      expect(AppTheme.primaryGreen, const Color(0xFF285A48));
      expect(AppTheme.lightGreen, const Color(0xFFB0E4CC));
      expect(AppTheme.darkText, const Color(0xFF091413));
    });

    testWidgets('AppTheme configures MaterialApp theme data', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.theme,
          home: Builder(
            builder: (context) {
              return Scaffold(
                appBar: AppBar(title: const Text('Theme Test')),
                body: ElevatedButton(
                  onPressed: () {},
                  child: const Text('Elevated'),
                ),
              );
            },
          ),
        ),
      );

      final BuildContext context = tester.element(find.byType(Scaffold));
      final theme = Theme.of(context);
      expect(theme.primaryColor, AppTheme.primaryGreen);
      expect(theme.scaffoldBackgroundColor, AppTheme.background);
    });
  });
}
