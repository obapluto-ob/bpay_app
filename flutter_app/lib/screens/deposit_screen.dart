import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/wallet_service.dart';

class DepositScreen extends StatefulWidget {
  final String token;
  final String country;
  const DepositScreen({super.key, required this.token, required this.country});
  @override
  State<DepositScreen> createState() => _DepositScreenState();
}

class _DepositScreenState extends State<DepositScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _btcAddress;
  bool _loadingAddress = false;
  String? _addressError;
  final _amountCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loadingDeposit = false;

  bool get _isNG => widget.country == 'NG';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBtcAddress();
  }

  Future<void> _loadBtcAddress() async {
    setState(() { _loadingAddress = true; _addressError = null; });
    try {
      final res = await WalletService.getBtcAddress(widget.token);
      final addr = res['address'] as String?;
      setState(() => _btcAddress = (addr != null && addr.isNotEmpty) ? addr : null);
      if (_btcAddress == null) setState(() => _addressError = res['error'] ?? 'Could not generate address');
    } catch (_) {
      setState(() => _addressError = 'Network error. Tap to retry.');
    }
    setState(() => _loadingAddress = false);
  }

  Future<void> _initiateDeposit() async {
    if (_amountCtrl.text.isEmpty || (!_isNG && _phoneCtrl.text.isEmpty)) return;
    setState(() => _loadingDeposit = true);
    try {
      final res = await WalletService.initiateDeposit(widget.token, _amountCtrl.text, _phoneCtrl.text);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(res['success'] == true ? 'Deposit initiated! Check your phone.' : res['error'] ?? 'Failed'),
        backgroundColor: res['success'] == true ? Colors.green : Colors.red,
      ));
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error'), backgroundColor: Colors.red));
    }
    setState(() => _loadingDeposit = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
              child: Row(
                children: [
                  IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                  const Expanded(child: Text('Deposit', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
                ],
              ),
            ),
            // Tab bar
            Container(
              margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              decoration: BoxDecoration(color: const Color(0xFF0f172a), borderRadius: BorderRadius.circular(12)),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(color: const Color(0xFFf59e0b), borderRadius: BorderRadius.circular(10)),
                indicatorSize: TabBarIndicatorSize.tab,
                labelColor: Colors.white,
                unselectedLabelColor: const Color(0xFF94a3b8),
                labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                tabs: [const Tab(text: '₿  Crypto'), Tab(text: _isNG ? '🏦  Bank' : '📱  M-Pesa')],
              ),
            ),
            // Content
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(top: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFFf1f5f9),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                ),
                child: TabBarView(
                  controller: _tabController,
                  children: [_buildCryptoTab(), _buildFiatTab()],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _logoUrl(String asset) => 'https://api.bpayapp.co.ke/api/logos/$asset';

  Widget _assetLogo(String asset, Color color, {double size = 44}) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.1)),
      child: ClipOval(child: Image.network(_logoUrl(asset), fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Center(child: Text(asset[0], style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: size * 0.4))))),
    );
  }

  Widget _buildCryptoTab() {
    const assets = [
      ('XBT', 'BTC', 'Bitcoin',      Color(0xFFf59e0b)),
      ('ETH', 'ETH', 'Ethereum',     Color(0xFF627EEA)),
      ('USDT','USDT','Tether',       Color(0xFF26A17B)),
      ('USDC','USDC','USD Coin',     Color(0xFF2775CA)),
      ('XRP', 'XRP', 'Ripple',       Color(0xFF346AA9)),
      ('SOL', 'SOL', 'Solana',       Color(0xFF9945FF)),
      ('TRX', 'TRX', 'Tron',         Color(0xFFEF0027)),
      ('BCH', 'BCH', 'Bitcoin Cash', Color(0xFF8DC351)),
    ];
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: assets.map((a) {
          final lunoAsset = a.$1;
          final ticker    = a.$2;
          final name      = a.$3;
          final color     = a.$4;
          final isBtc     = lunoAsset == 'XBT';
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    _assetLogo(ticker, color),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(ticker, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0f172a))),
                      Text(name, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
                    ])),
                    if (isBtc)
                      ElevatedButton(
                        onPressed: _loadingAddress ? null : _loadBtcAddress,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color, elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Get Address', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      )
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                        child: const Text('Coming Soon', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                  ],
                ),
                if (isBtc) ...[
                  const SizedBox(height: 12),
                  if (_loadingAddress)
                    const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator(color: Color(0xFFf59e0b)))
                  else if (_btcAddress != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: const Color(0xFFf8fafc), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFe2e8f0))),
                      child: Row(
                        children: [
                          Expanded(child: Text(_btcAddress!, style: const TextStyle(fontFamily: 'monospace', fontSize: 11, color: Color(0xFF0f172a)))),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: _btcAddress!));
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Address copied!'), backgroundColor: Colors.green));
                            },
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                              child: const Icon(Icons.copy, color: Color(0xFFf59e0b), size: 16),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(8)),
                      child: const Row(children: [
                        Icon(Icons.info_outline, color: Color(0xFFf59e0b), size: 16),
                        SizedBox(width: 8),
                        Expanded(child: Text('Send only BTC to this address. Min: 0.0001 BTC', style: TextStyle(color: Color(0xFF92400e), fontSize: 11))),
                      ]),
                    ),
                  ] else if (_addressError != null)
                    Text(_addressError!, style: const TextStyle(color: Colors.red, fontSize: 12), textAlign: TextAlign.center),
                ],
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFiatTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_isNG ? '🏦 Bank Transfer' : '📱 M-Pesa', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0f172a))),
                const SizedBox(height: 16),
                _infoRow(_isNG ? 'Bank' : 'Paybill', _isNG ? 'First Bank Nigeria' : '522522'),
                _infoRow(_isNG ? 'Account' : 'Account', _isNG ? '0123456789' : 'Your registered email'),
                _infoRow(_isNG ? 'Name' : 'Business', _isNG ? 'BPay Technologies Ltd' : 'BPay Kenya'),
                if (_isNG) _infoRow('Sort Code', '011151003'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          _label(_isNG ? 'Amount (NGN)' : 'Amount (KES)'),
          const SizedBox(height: 8),
          _inputField(_amountCtrl, _isNG ? 'Enter NGN amount' : 'Enter KES amount', TextInputType.number),
          if (!_isNG) ...[
            const SizedBox(height: 16),
            _label('M-Pesa Phone Number'),
            const SizedBox(height: 8),
            _inputField(_phoneCtrl, '254XXXXXXXXX', TextInputType.phone),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loadingDeposit ? null : _initiateDeposit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFf59e0b),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: _loadingDeposit
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(_isNG ? 'I Have Made Payment' : 'Send M-Pesa Prompt',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          SizedBox(width: 90, child: Text(label, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0f172a), fontSize: 13))),
        ],
      ),
    );
  }

  Widget _label(String text) => Text(text, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0f172a), fontSize: 14));

  Widget _inputField(TextEditingController ctrl, String hint, TextInputType type) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
      child: TextField(
        controller: ctrl,
        keyboardType: type,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF94a3b8), fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }


}
