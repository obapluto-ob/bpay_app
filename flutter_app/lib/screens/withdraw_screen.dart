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
  String _selectedAsset = 'BTC';

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

  double get _balance {
    final b = widget.balance[_selectedAsset] ?? 0;
    return (b as num).toDouble();
  }

  Color get _assetColor => _assets.firstWhere((a) => a.$1 == _selectedAsset).$4;
  String get _lunoAsset => _assets.firstWhere((a) => a.$1 == _selectedAsset).$3;

  Future<void> _withdraw() async {
    final amount  = _amountCtrl.text.trim();
    final address = _addressCtrl.text.trim();
    if (amount.isEmpty || address.isEmpty) { _snack('Please fill all fields', Colors.red); return; }
    final amountNum = double.tryParse(amount);
    if (amountNum == null || amountNum <= 0) { _snack('Invalid amount', Colors.red); return; }
    if (amountNum > _balance) { _snack('Insufficient $_selectedAsset balance', Colors.red); return; }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Withdrawal', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _confirmRow('Asset',   _selectedAsset),
          _confirmRow('Amount',  '$amount $_selectedAsset'),
          _confirmRow('To',      address.length > 14 ? '${address.substring(0, 8)}...${address.substring(address.length - 6)}' : address),
          const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)),
            child: const Text('⚠️ This cannot be undone. Verify the address carefully.',
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
      final res = await WalletService.sendCrypto(widget.token, _lunoAsset, amount, address);
      if (!mounted) return;
      if (res['success'] == true) {
        _snack('Withdrawal sent!', Colors.green);
        Navigator.pop(context);
      } else {
        _snack(res['error'] ?? 'Withdrawal failed', Colors.red);
      }
    } catch (_) {
      _snack('Network error. Please try again.', Colors.red);
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

  @override
  Widget build(BuildContext context) {
    final color = _assetColor;
    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
              child: Row(children: [
                IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                const Expanded(child: Text('Withdraw Crypto', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
              ]),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(top: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFFf1f5f9),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                    // Asset selector
                    const Text('Select Asset', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0f172a))),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 72,
                      child: ListView(scrollDirection: Axis.horizontal, children: _assets.map((a) {
                        final selected = _selectedAsset == a.$1;
                        return GestureDetector(
                          onTap: () => setState(() { _selectedAsset = a.$1; _amountCtrl.clear(); }),
                          child: Container(
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: selected ? a.$4 : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: selected ? a.$4 : const Color(0xFFe2e8f0)),
                              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
                            ),
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              _logo(a.$1, a.$4, size: 24),
                              const SizedBox(height: 4),
                              Text(a.$1, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                                color: selected ? Colors.white : const Color(0xFF0f172a))),
                            ]),
                          ),
                        );
                      }).toList()),
                    ),
                    const SizedBox(height: 20),

                    // Balance card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
                      child: Row(children: [
                        _logo(_selectedAsset, color, size: 44),
                        const SizedBox(width: 14),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Text('Available Balance', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
                          Text('${_balance.toStringAsFixed(8).replaceAll(RegExp(r'0+$'), '').replaceAll(RegExp(r'\.$'), '')} $_selectedAsset',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
                        ])),
                        GestureDetector(
                          onTap: () => _amountCtrl.text = _balance.toStringAsFixed(8).replaceAll(RegExp(r'0+$'), '').replaceAll(RegExp(r'\.$'), ''),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: Text('MAX', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
                          ),
                        ),
                      ]),
                    ),
                    const SizedBox(height: 20),

                    // Amount
                    _label('Amount ($_selectedAsset)'),
                    const SizedBox(height: 8),
                    _inputField(_amountCtrl, '0.00000000', TextInputType.number),
                    const SizedBox(height: 16),

                    // Address
                    _label('$_selectedAsset Wallet Address'),
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
                        onPressed: _loading ? null : _withdraw,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFef4444),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        child: _loading
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text('Withdraw $_selectedAsset', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

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
