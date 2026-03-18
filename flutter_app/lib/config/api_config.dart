class ApiConfig {
  // Toggle: true = local backend, false = production Render
  static const bool _useLocal = true;

  static const String baseUrl = _useLocal
      ? 'http://localhost:3001/api'
      : 'https://bpay-app.onrender.com/api';

  static const String wsUrl = _useLocal
      ? 'ws://localhost:3001'
      : 'wss://bpay-app.onrender.com';

  // Auth
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';

  // Trade
  static const String rates = '$baseUrl/live-rates';
  static const String createTrade = '$baseUrl/trade/create';
  static const String tradeHistory = '$baseUrl/trade/history';
  static String tradeChat(String id) => '$baseUrl/trade/$id/chat';

  // Wallet
  static const String balance = '$baseUrl/user/balance';
  static const String withdraw = '$baseUrl/user/withdraw';
  static const String deposit = '$baseUrl/deposit/initiate';

  // Luno
  static const String lunoBalance = '$baseUrl/luno/balance';
  static const String lunoAddress = '$baseUrl/luno/address';
  static const String lunoSend = '$baseUrl/luno/send';
}
