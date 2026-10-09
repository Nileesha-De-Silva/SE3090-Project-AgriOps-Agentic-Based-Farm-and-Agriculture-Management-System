import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:agriops_mobile/main.dart';

void main() {
  testWidgets('App launches and displays Sign In and Sign Up options as very first UI', (WidgetTester tester) async {
    await tester.pumpWidget(const AgriOpsApp());

    // Very first UI must display Sign In and Sign Up options
    expect(find.text('Sign In'), findsAtLeastNWidgets(1));
    expect(find.text('Sign Up'), findsAtLeastNWidgets(1));
    expect(find.text('Password'), findsOneWidget);

    // Protected main navigation bar must not be visible before login
    expect(find.byType(NavigationBar), findsNothing);
  });
}