import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('token');
  runApp(BPayApp(isLoggedIn: token != null && token.isNotEmpty));
}

class BPayApp extends StatelessWidget {
  final bool isLoggedIn;
  const BPayApp({super.key, required this.isLoggedIn});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BPay',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF1a365d)),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: isLoggedIn ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
