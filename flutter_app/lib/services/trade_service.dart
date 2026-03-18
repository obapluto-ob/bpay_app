import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class TradeService {
  // Fetch BTC/KES rate directly from Luno public API (no auth needed)
  static Future<Map<String, dynamic>> getRates() async {
    try {
      final res = await http.get(
        Uri.parse(ApiConfig.rates),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}
    return {'btcKes': 0, 'rates': {}};
  }

  static Future<Map<String, dynamic>> createTrade(String token, Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse(ApiConfig.createTrade),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    return jsonDecode(res.body);
  }

  static Future<List> getHistory(String token) async {
    final res = await http.get(
      Uri.parse(ApiConfig.tradeHistory),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(res.body);
    return data['trades'] ?? [];
  }

  static Future<List> getChatMessages(String token, String tradeId) async {
    final res = await http.get(
      Uri.parse(ApiConfig.tradeChat(tradeId)),
      headers: {'Authorization': 'Bearer $token'},
    );
    final data = jsonDecode(res.body);
    return data['messages'] ?? [];
  }

  static Future<void> sendChatMessage(String token, String tradeId, String message) async {
    await http.post(
      Uri.parse(ApiConfig.tradeChat(tradeId)),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'message': message, 'type': 'text'}),
    );
  }
}
