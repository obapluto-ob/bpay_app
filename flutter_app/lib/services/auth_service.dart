import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

// Web JS interop
import 'google_auth_web.dart' if (dart.library.io) 'google_auth_stub.dart';

class AuthService {
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse(ApiConfig.login),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    ).timeout(const Duration(seconds: 60), onTimeout: () {
      throw Exception('Server is waking up, please try again in a moment');
    });
    final data = jsonDecode(res.body);
    if (res.statusCode == 200 && data['token'] != null) {
      await _saveSession(data);
    }
    return data;
  }

  static Future<Map<String, dynamic>> register(
      String name, String email, String password, String country) async {
    final res = await http.post(
      Uri.parse(ApiConfig.register),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(
          {'fullName': name, 'email': email, 'password': password, 'country': country}),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/auth/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> googleLogin() async {
    try {
      if (!kIsWeb) return {'error': 'Google sign-in not supported on this platform yet'};

      final idToken = await getGoogleIdTokenWeb();
      print('DEBUG idToken: $idToken');
      if (idToken == null || idToken.isEmpty) {
        return {'error': 'Google sign-in was cancelled'};
      }

      final url = '${ApiConfig.baseUrl}/auth/google';
      print('DEBUG posting to: $url');
      final res = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      ).timeout(const Duration(seconds: 60), onTimeout: () {
        throw Exception('Server is waking up, please try again in a moment');
      });
      print('DEBUG response: ${res.statusCode} ${res.body}');
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['token'] != null) {
        await _saveSession(data);
      }
      return data;
    } catch (e) {
      print('DEBUG googleLogin error: $e');
      return {'error': 'Google sign-in failed: $e'};
    }
  }

  static Future<void> _saveSession(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', data['token']);
    await prefs.setString('user', jsonEncode(data['user']));
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();
    final user = prefs.getString('user');
    return user != null ? jsonDecode(user) : null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
  }
}
