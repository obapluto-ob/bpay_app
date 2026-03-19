import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class NotificationService {
  static Future<Map<String, dynamic>> getNotifications(String token) async {
    try {
      final res = await http.get(
        Uri.parse(ApiConfig.notifications),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
    } catch (_) {}
    return {'notifications': [], 'unread': 0};
  }
}
