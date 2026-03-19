import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/trade_service.dart';
import '../services/wallet_service.dart';
import 'login_screen.dart';
import 'buy_screen.dart';
import 'sell_screen.dart';
import 'deposit_screen.dart';
import 'withdraw_screen.dart';
import 'trade_history_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic> _rates = {};
  Map<String, dynamic> _balance = {};
  Map<String, dynamic>? _user;
  String _token = '';
  bool _loading = true;
  String _selectedAccount = 'crypto'; // crypto, kenya
  int _activeTab = 0; // 0=home, 1=sell/buy, 2=history, 3=profile

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    _token = await AuthService.getToken() ?? '';
    _user = await AuthService.getUser();
    await _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final rates = await TradeService.getRates();
      final balance = await WalletService.getBalance(_token);
      setState(() {
        _rates = rates;
        _balance = balance;
      });
    } catch (_) {}
    setState(() => _loading = false);
  }

  bool get _isCrypto => _selectedAccount == 'crypto';
  bool get _isKES => _selectedAccount == 'kenya';
  String get _currency => 'KSh';

  double get _btcBalance => (_balance['BTC'] ?? 0).toDouble();
  double get _kesBalance => (_balance['KES'] ?? 0).toDouble();

  double _getBtcRate() {
    try {
      // Luno returns btcKes directly
      if (_rates['btcKes'] != null) return (_rates['btcKes'] as num).toDouble();
      // Fallback: CoinGecko format
      final usdRate = (_rates['bitcoin']?['usd'] ?? 0).toDouble();
      final fxRate = (_rates['usdKes'] ?? 150).toDouble();
      return usdRate * fxRate;
    } catch (_) { return 0; }
  }

  String get _userName {
    final user = _user;
    if (user == null) return 'User';
    return user['fullName'] ?? user['name'] ?? user['email'] ?? 'User';
  }

  void _navigate(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen))
        .then((_) => _loadData());
  }

  Future<void> _logout() async {
    await AuthService.logout();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFF1e293b),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFFf59e0b)),
              SizedBox(height: 16),
              Text('Loading BPay...', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFf1f5f9),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                ),
                child: RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildBalanceSection(),
                        const SizedBox(height: 20),
                        _buildQuickActions(),
                        const SizedBox(height: 20),
                        _buildLiveRates(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: const BoxDecoration(color: Color(0xFFf59e0b), shape: BoxShape.circle),
            child: Center(
              child: Text(
                _userName.isNotEmpty ? _userName[0].toUpperCase() : 'U',
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Welcome back', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                Text(_userName, style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildBalanceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Your Balances', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
        const SizedBox(height: 12),

        // Tab switcher
        Container(
          decoration: BoxDecoration(color: const Color(0xFFe2e8f0), borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.all(4),
          child: Row(
            children: [
              _tabBtn('₿ Crypto', 'crypto'),
              _tabBtn('🇰🇪 KES', 'kenya'),
              _tabBtn('🇳🇬 NGN', 'ngn_soon', comingSoon: true),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Balance card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)],
          ),
          child: _buildBalanceContent(),
        ),
      ],
    );
  }

  Widget _tabBtn(String label, String value, {bool comingSoon = false}) {
    final selected = _selectedAccount == value;
    return Expanded(
      child: GestureDetector(
        onTap: comingSoon ? null : () => setState(() => _selectedAccount = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? const Color(0xFFf59e0b) : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(label, textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                  color: comingSoon ? Colors.grey : selected ? Colors.white : const Color(0xFF64748b))),
              if (comingSoon) const Text('Soon', style: TextStyle(fontSize: 9, color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceContent() {
    if (_isCrypto) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [const Text('₿', style: TextStyle(fontSize: 22)), const SizedBox(width: 8), const Text('Crypto Assets', style: TextStyle(color: Color(0xFF64748b), fontWeight: FontWeight.w600))]),
          const SizedBox(height: 12),
          _cryptoRow('BTC', '${(_balance['btc_balance'] ?? _balance['BTC'] ?? 0).toStringAsFixed(6)} BTC'),
          _cryptoRow('ETH', '${(_balance['eth_balance'] ?? _balance['ETH'] ?? 0).toStringAsFixed(6)} ETH'),
          _cryptoRow('USDT', '${(_balance['usdt_balance'] ?? _balance['USDT'] ?? 0).toStringAsFixed(2)} USDT'),
          _cryptoRow('USDC', '${(_balance['usdc_balance'] ?? _balance['USDC'] ?? 0).toStringAsFixed(2)} USDC'),
          _cryptoRow('XRP', '${(_balance['xrp_balance'] ?? _balance['XRP'] ?? 0).toStringAsFixed(4)} XRP'),
          _cryptoRow('SOL', '${(_balance['sol_balance'] ?? _balance['SOL'] ?? 0).toStringAsFixed(6)} SOL'),
          _cryptoRow('TRX', '${(_balance['trx_balance'] ?? _balance['TRX'] ?? 0).toStringAsFixed(2)} TRX'),
          _cryptoRow('BCH', '${(_balance['bch_balance'] ?? _balance['BCH'] ?? 0).toStringAsFixed(6)} BCH'),
        ],
      );
    }

    // KES balance
    final btcVal = _btcBalance * _getBtcRate();
    final total = _kesBalance + btcVal;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [const Text('🇰🇪', style: TextStyle(fontSize: 22)), const SizedBox(width: 8), const Text('KES', style: TextStyle(color: Color(0xFF64748b), fontWeight: FontWeight.w600))]),
        const SizedBox(height: 8),
        Text('KSh${total.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}',
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
        const Divider(height: 20),
        Text('KES Fiat: KSh${_kesBalance.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF475569), fontSize: 13)),
        Text('BTC value: KSh${btcVal.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF475569), fontSize: 13)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
          child: const Text('✅ Powered by Luno', style: TextStyle(fontSize: 11, color: Colors.green)),
        ),
      ],
    );
  }

  Widget _cryptoRow(String asset, String balance, {bool comingSoon = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          _cryptoLogo(asset, size: 28),
          const SizedBox(width: 10),
          Expanded(child: Text(balance, style: TextStyle(fontWeight: FontWeight.w600, color: comingSoon ? Colors.grey : const Color(0xFF0f172a)))),
          if (comingSoon) Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(8)),
            child: const Text('Soon', style: TextStyle(fontSize: 10, color: Colors.grey)),
          ),
        ],
      ),
    );
  }

  Widget _cryptoLogo(String asset, {double size = 36}) {
    const colors = {
      'BTC': Color(0xFFf59e0b), 'ETH': Color(0xFF627EEA),
      'USDT': Color(0xFF26A17B), 'USDC': Color(0xFF2775CA),
      'XRP': Color(0xFF346AA9), 'SOL': Color(0xFF9945FF),
      'TRX': Color(0xFFEF0027), 'BCH': Color(0xFF8DC351),
    };
    final color = colors[asset] ?? Colors.grey;
    final url = 'https://api.bpayapp.co.ke/api/logos/$asset';
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.1)),
      child: ClipOval(child: Image.network(url, width: size, height: size, fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Center(child: Text(asset[0], style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: size * 0.4))))),
    );
  }

  Widget _buildQuickActions() {
    final isCrypto = _isCrypto;
    final actions = isCrypto ? [
      ('Sell',     Icons.arrow_circle_down_rounded, const Color(0xFFef4444), () => _navigate(SellScreen(token: _token, country: 'KE', rates: _rates, balance: _balance))),
      ('Deposit',  Icons.add_circle_outline_rounded, const Color(0xFF3b82f6), () => _navigate(DepositScreen(token: _token, country: 'KE'))),
      ('Withdraw', Icons.arrow_circle_up_rounded,   const Color(0xFFf59e0b), () => _navigate(WithdrawScreen(token: _token, balance: _balance))),
      ('History',  Icons.receipt_long_outlined,     const Color(0xFF8b5cf6), () => _navigate(TradeHistoryScreen(token: _token))),
    ] : [
      ('Buy',      Icons.arrow_circle_up_rounded,   const Color(0xFF10b981), () => _navigate(BuyScreen(token: _token, country: 'KE', rates: _rates))),
      ('Deposit',  Icons.add_circle_outline_rounded, const Color(0xFF3b82f6), () => _navigate(DepositScreen(token: _token, country: 'KE'))),
      ('Withdraw', Icons.arrow_circle_down_rounded, const Color(0xFFf59e0b), () => _navigate(WithdrawScreen(token: _token, balance: _balance))),
      ('History',  Icons.receipt_long_outlined,     const Color(0xFF8b5cf6), () => _navigate(TradeHistoryScreen(token: _token))),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: actions.map((a) => GestureDetector(
            onTap: a.$4,
            child: Column(children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: a.$3.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(a.$2, color: a.$3, size: 26),
              ),
              const SizedBox(height: 6),
              Text(a.$1, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: a.$3)),
            ]),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildLiveRates() {
    final r = (_rates['rates'] as Map?) ?? {};
    final source = _rates['source'] == 'luno' ? '🟢 Luno Live' : _rates['source'] == 'cached' ? '🟡 Cached' : _rates['source'] == 'fallback' ? '🔴 Offline' : '⚪ ...';

    String fmt(dynamic val) {
      final n = (val as num?)?.toDouble() ?? 0;
      if (n == 0) return '—';
      if (n < 10)   return 'KSh${n.toStringAsFixed(4)}';
      if (n < 1000) return 'KSh${n.toStringAsFixed(2)}';
      return 'KSh${n.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}'; 
    }

    const rateAssets = [
      ('BTC', 'Bitcoin',      Color(0xFFf59e0b)),
      ('ETH', 'Ethereum',     Color(0xFF627EEA)),
      ('USDT','Tether',       Color(0xFF26A17B)),
      ('USDC','USD Coin',     Color(0xFF2775CA)),
      ('XRP', 'Ripple',       Color(0xFF346AA9)),
      ('SOL', 'Solana',       Color(0xFF9945FF)),
      ('TRX', 'Tron',         Color(0xFFEF0027)),
      ('BCH', 'Bitcoin Cash', Color(0xFF8DC351)),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Live Rates', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
            Text(source, style: const TextStyle(fontSize: 11, color: Colors.green)),
          ],
        ),
        const SizedBox(height: 12),
        ...rateAssets.map((a) {
          final kes = r[a.$1]?['kes'];
          final btcAsk = (_rates['btcKesAsk'] as num?)?.toDouble() ?? 0;
          final displayRate = a.$1 == 'BTC' ? fmt(_getBtcRate()) : fmt(kes);
          final sub = a.$1 == 'BTC' && btcAsk > 0 ? 'Ask: ${fmt(btcAsk)}' : null;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
            child: Row(children: [
              _cryptoLogo(a.$1),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(a.$1, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(a.$2, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(displayRate, style: TextStyle(color: a.$3, fontWeight: FontWeight.bold, fontSize: 14)),
                if (sub != null) Text(sub, style: const TextStyle(fontSize: 10, color: Color(0xFF94a3b8)))
                else Text('via Luno', style: TextStyle(fontSize: 10, color: a.$3.withOpacity(0.6))),
              ]),
            ]),
          );
        }),
      ],
    );
  }



  Widget _buildBottomNav() {
    final isCrypto = _isCrypto;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFe2e8f0))),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 12, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
          child: Row(
            children: [
              _navItem(Icons.home_outlined, Icons.home, 'Home', 0, () => setState(() => _activeTab = 0)),
              if (isCrypto) _navItem(Icons.arrow_downward, Icons.arrow_downward, 'Sell', 1,
                () { setState(() => _activeTab = 1); _navigate(SellScreen(token: _token, country: 'KE', rates: _rates, balance: _balance)); }),
              if (!isCrypto) _navItem(Icons.arrow_upward, Icons.arrow_upward, 'Buy', 1,
                () { setState(() => _activeTab = 1); _navigate(BuyScreen(token: _token, country: 'KE', rates: _rates)); }),
              _navItem(Icons.history_outlined, Icons.history, 'History', 2,
                () { setState(() => _activeTab = 2); _navigate(TradeHistoryScreen(token: _token)); }),
              _navItem(Icons.person_outline, Icons.person, 'Profile', 3, _showProfile),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(IconData icon, IconData activeIcon, String label, int index, VoidCallback onTap) {
    final active = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 6),
          decoration: BoxDecoration(
            color: active ? const Color(0xFFfff7ed) : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(active ? activeIcon : icon, size: 22, color: active ? const Color(0xFFf59e0b) : const Color(0xFF64748b)),
              const SizedBox(height: 3),
              Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: active ? const Color(0xFFf59e0b) : const Color(0xFF64748b))),
            ],
          ),
        ),
      ),
    );
  }

  void _showProfile() {
    setState(() => _activeTab = 3);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            CircleAvatar(radius: 32, backgroundColor: const Color(0xFFf59e0b),
              child: Text(_userName.isNotEmpty ? _userName[0].toUpperCase() : 'U',
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold))),
            const SizedBox(height: 12),
            Text(_userName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(_user?['email'] ?? '', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),
            ListTile(leading: const Icon(Icons.logout, color: Colors.red), title: const Text('Logout', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
              onTap: () { Navigator.pop(context); _logout(); }),
          ],
        ),
      ),
    );
  }
}
