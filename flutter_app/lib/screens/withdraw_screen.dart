import 'package:flutter/material.dart';
import '../services/wallet_service.dart';

class WithdrawScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> balance;
  const WithdrawScreen({super.key, required this.token, required this.balance});
  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountCtrl  = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _loading = false;
  String? _selectedAsset; // null = list view, set = form view

  static const _assets = [
    ('BTC',  'Bitcoin',      'XBT',  Color(0xFFf59e0b)),
    ('ETH',  'Ethereum',     'ETH',  Color(0xFF627EEA)),
    ('USDT', 'Tether',       'USDT', Color(0xFF26A17B)),
    ('USDC', 'USD Coin',     'USDC', Color(0xFF2775CA)),
    ('XRP',  'Ripple',       'XRP',  Color(0xFF346AA9)),
    ('SOL',  'Solana',       'SOL',  Color(0xFF9945FF)),
    ('TRX',  'Tron',         'TRX',  Color(0xFFEF0027)),
    ('BCH',  'Bitcoin Cash', 'BCH',  Color(0xFF8DC351)),
  ];

  double _getBalance(String ticker) {
    final b = widget.balance[ticker] ?? 0;
    return (b as num).toDouble();
  }

  String _fmt(double val, String ticker) {
    if (['USDT', 'USDC', 'TRX'].contains(ticker)) return val.toStringAsFixed(2);
    if (ticker == 'XRP') return val.toStringAsFixed(4);
    return val.toStringAsFixed(6);
  }

  Future<void> _withdraw(String ticker, String lunoAsset, Color color) async {
    final amount  = _amountCtrl.text.trim();
    final address = _addressCtrl.text.trim();
    if (amount.isEmpty || address.isEmpty) { _snack('Please fill all fields', Colors.red); return; }
    final amountNum = double.tryParse(amount);
    if (amountNum == null || amountNum <= 0) { _snack('Invalid amount', Colors.red); return; }
    if (amountNum > _getBalance(ticker)) { _snack('Insufficient $ticker balance', Colors.red); return; }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Withdrawal', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _confirmRow('Asset',  ticker),
          _confirmRow('Amount', '$amount $ticker'),
          _confirmRow('To',     address.length > 14 ? '${address.substring(0, 8)}...${address.substring(address.length - 6)}' : address),
          const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)),
            child: const Text('⚠️ Cannot be undone. Verify the address carefully.',
              style: TextStyle(color: Colors.orange, fontSize: 12))),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFef4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _loading = true);
    try {
      final res = await WalletService.sendCrypto(widget.token, lunoAsset, amount, address);
      if (!mounted) return;
      if (res['success'] == true) {
        _snack('Withdrawal sent!', Colors.green);
        Navigator.pop(context);
      } else {
        _snack(res['error'] ?? 'Withdrawal failed', Colors.red);
      }
    } catch (_) {
      _snack('Network error', Colors.red);
    }
    setState(() => _loading = false);
  }

  void _snack(String msg, Color color) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));

  Widget _confirmRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      SizedBox(width: 60, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
    ]),
  );

  Widget _logo(String asset, Color color, {double size = 36}) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.1)),
      child: ClipOval(child: Image.network(
        'https://api.bpayapp.co.ke/api/logos/$asset',
        width: size, height: size, fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Center(child: Text(asset[0],
          style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: size * 0.4))),
      )),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
            child: Row(children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () {
                  if (_selectedAsset != null) {
                    setState(() { _selectedAsset = null; _amountCtrl.clear(); _addressCtrl.clear(); });
                  } else {
                    Navigator.pop(context);
                  }
                },
              ),
              Expanded(child: Text(
                _selectedAsset != null ? 'Withdraw $_selectedAsset' : 'Withdraw Crypto',
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              )),
            ]),
          ),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(top: 16),
              decoration: const BoxDecoration(
                color: Color(0xFFf1f5f9),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
              ),
              child: _selectedAsset == null ? _buildAssetList() : _buildForm(),
            ),
          ),
        ]),
      ),
    );
  }

  // Step 1 — pick asset (same card style as dashboard)
  Widget _buildAssetList() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select asset to withdraw', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
          const SizedBox(height: 12),
          ..._assets.map((a) {
            final ticker = a.$1;
            final name   = a.$2;
            final color  = a.$4;
            final bal    = _getBalance(ticker);
            return GestureDetector(
              onTap: () => setState(() { _selectedAsset = ticker; _amountCtrl.clear(); _addressCtrl.clear(); }),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
                ),
                child: Row(children: [
                  _logo(ticker, color, size: 44),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(ticker, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0f172a))),
                    Text(name,   style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
                  ])),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(_fmt(bal, ticker), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
                    Text(ticker, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
                  ]),
                  const SizedBox(width: 8),
                  const Icon(Icons.chevron_right, color: Color(0xFF94a3b8)),
                ]),
              ),
            );
          }),
        ],
      ),
    );
  }

  // Step 2 — enter amount + address
  Widget _buildForm() {
    final a     = _assets.firstWhere((x) => x.$1 == _selectedAsset!);
    final ticker = a.$1;
    final luno   = a.$3;
    final color  = a.$4;
    final bal    = _getBalance(ticker);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Balance card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
          child: Row(children: [
            _logo(ticker, color, size: 48),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Available Balance', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
              Text('${_fmt(bal, ticker)} $ticker',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: color)),
            ])),
            GestureDetector(
              onTap: () => setState(() => _amountCtrl.text = _fmt(bal, ticker)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Text('MAX', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 20),

        _label('Amount ($ticker)'),
        const SizedBox(height: 8),
        _inputField(_amountCtrl, '0.00', TextInputType.number),
        const SizedBox(height: 16),

        _label('$ticker Wallet Address'),
        const SizedBox(height: 8),
        _inputField(_addressCtrl, 'Enter destination address', TextInputType.text),
        const SizedBox(height: 8),

        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(10)),
          child: const Row(children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 18),
            SizedBox(width: 8),
            Expanded(child: Text('Double-check the address. Crypto sent to wrong address cannot be recovered.',
              style: TextStyle(color: Color(0xFF92400e), fontSize: 12, height: 1.5))),
          ]),
        ),
        const SizedBox(height: 28),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : () => _withdraw(ticker, luno, color),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFef4444),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Withdraw $ticker', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ]),
    );
  }

  Widget _label(String text) => Text(text, style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF0f172a), fontSize: 14));

  Widget _inputField(TextEditingController ctrl, String hint, TextInputType type) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
      child: TextField(
        controller: ctrl, keyboardType: type,
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
