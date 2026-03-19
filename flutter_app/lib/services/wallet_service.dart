import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class WalletService {
  static Future<Map<String, dynamic>> getBalance(String token) async {
    final res = await http.get(
      Uri.parse(ApiConfig.balance),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> getAddress(String token, String lunoAsset) async {
    final res = await http.get(
      Uri.parse('${ApiConfig.lunoAddress}?asset=$lunoAsset'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> sendCrypto(String token, String asset, String amount, String address) async {
    final res = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/withdrawals/crypto'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'amount': amount, 'address': address}),
    );
    return jsonDecode(res.body);
  }

  static Future<Map<String, dynamic>> initiateDeposit(String token, String amount, String phone) async {
    final res = await http.post(
      Uri.parse(ApiConfig.deposit),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: jsonEncode({'amount': amount, 'phoneNumber': phone}),
    );
    return jsonDecode(res.body);
  }
}
