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
  final _amountCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _loading = false;

  double get _btcBalance => (widget.balance['BTC'] ?? widget.balance['btc'] ?? 0).toDouble();

  Future<void> _withdraw() async {
    final amount = _amountCtrl.text.trim();
    final address = _addressCtrl.text.trim();
    if (amount.isEmpty || address.isEmpty) {
      _snack('Please fill all fields', Colors.red);
      return;
    }
    final amountNum = double.tryParse(amount);
    if (amountNum == null || amountNum <= 0) { _snack('Invalid amount', Colors.red); return; }
    if (amountNum < 0.0001) { _snack('Minimum withdrawal is 0.0001 BTC', Colors.red); return; }
    if (amountNum > _btcBalance) { _snack('Insufficient balance', Colors.red); return; }

    // Confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Withdrawal', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          _confirmRow('Amount', '$amount BTC'),
          _confirmRow('To', '${address.substring(0, 8)}...${address.substring(address.length - 6)}'),
          const SizedBox(height: 12),
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)),
            child: const Text('⚠️ This cannot be undone. Verify the address carefully.', style: TextStyle(color: Colors.orange, fontSize: 12))),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFef4444), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _loading = true);
    try {
      final res = await WalletService.sendCrypto(widget.token, 'BTC', amount, address);
      if (!mounted) return;
      if (res['success'] == true) {
        _snack('Withdrawal sent successfully!', Colors.green);
        Navigator.pop(context);
      } else {
        _snack(res['error'] ?? 'Withdrawal failed', Colors.red);
      }
    } catch (_) {
      _snack('Network error. Please try again.', Colors.red);
    }
    setState(() => _loading = false);
  }

  void _snack(String msg, Color color) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(msg), backgroundColor: color),
  );

  Widget _confirmRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      SizedBox(width: 60, child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13))),
      Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
    ]),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
              child: Row(children: [
                IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                const Expanded(child: Text('Withdraw BTC', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Balance card
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12)],
                        ),
                        child: Row(children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFFf59e0b).withOpacity(0.1)),
                            child: ClipOval(child: Image.network(
                              'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const Icon(Icons.currency_bitcoin, color: Color(0xFFf59e0b)),
                            )),
                          ),
                          const SizedBox(width: 14),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            const Text('Available Balance', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                            Text('${_btcBalance.toStringAsFixed(6)} BTC',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF0f172a))),
                          ])),
                          GestureDetector(
                            onTap: () => _amountCtrl.text = _btcBalance.toStringAsFixed(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                              child: const Text('MAX', style: TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.bold, fontSize: 12)),
                            ),
                          ),
                        ]),
                      ),
                      const SizedBox(height: 20),

                      // Amount field
                      _label('Amount (BTC)'),
                      const SizedBox(height: 8),
                      _inputField(_amountCtrl, '0.00000000', TextInputType.number),
                      const SizedBox(height: 16),

                      // Address field
                      _label('BTC Wallet Address'),
                      const SizedBox(height: 8),
                      _inputField(_addressCtrl, 'Enter destination BTC address', TextInputType.text),
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
                      const SizedBox(height: 24),

                      // Coming soon assets
                      const Text('Other Assets', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0f172a))),
                      const SizedBox(height: 12),
                      _comingSoonRow('ETH', 'Ethereum', 'https://cryptologos.cc/logos/ethereum-eth-logo.png', const Color(0xFF627EEA)),
                      _comingSoonRow('USDT', 'Tether', 'https://cryptologos.cc/logos/tether-usdt-logo.png', const Color(0xFF26A17B)),
                      _comingSoonRow('XRP', 'Ripple', 'https://cryptologos.cc/logos/xrp-xrp-logo.png', const Color(0xFF346AA9)),
                      _comingSoonRow('KES', 'M-Pesa', null, const Color(0xFF10b981)),
                      _comingSoonRow('NGN', 'Bank Transfer', null, const Color(0xFF3b82f6)),
                      const SizedBox(height: 24),

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
                              : const Text('Withdraw BTC', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
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

  Widget _comingSoonRow(String asset, String name, String? logoUrl, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.1)),
          child: logoUrl != null
              ? ClipOval(child: Image.network(logoUrl, fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Center(child: Text(asset[0], style: TextStyle(color: color, fontWeight: FontWeight.bold)))))
              : Center(child: Text(asset[0], style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16))),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(asset, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0f172a))),
          Text(name, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
          child: const Text('Coming Soon', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w600)),
        ),
      ]),
    );
  }
}
