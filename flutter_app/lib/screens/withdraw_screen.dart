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
  String _selectedAsset = 'BTC';
  final _amountCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _loading = false;

  final List<String> _activeAssets = ['BTC'];
  final List<String> _comingSoon = ['ETH', 'USDT', 'XRP', 'NGN', 'KES'];

  Future<void> _withdraw() async {
    if (_amountCtrl.text.isEmpty || _addressCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all fields'), backgroundColor: Colors.red));
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await WalletService.sendCrypto(widget.token, _selectedAsset, _amountCtrl.text, _addressCtrl.text);
      if (!mounted) return;
      if (res['success'] == true || res['withdrawal_id'] != null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal submitted successfully!'), backgroundColor: Colors.green));
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['error'] ?? 'Failed'), backgroundColor: Colors.red));
      }
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error'), backgroundColor: Colors.red));
    }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final btcBalance = (widget.balance['BTC'] ?? 0).toDouble();

    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(backgroundColor: const Color(0xFF1a365d), title: const Text('Withdraw', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Asset', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ..._activeAssets.map((a) => _assetChip(a, true)),
                ..._comingSoon.map((a) => _assetChip(a, false)),
              ],
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Available Balance'),
                  Text('${btcBalance.toStringAsFixed(6)} BTC', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b))),
                ],
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Amount (BTC)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFf59e0b))),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _addressCtrl,
              decoration: InputDecoration(
                labelText: 'BTC Wallet Address',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFf59e0b))),
              ),
            ),
            const SizedBox(height: 8),
            const Text('⚠️ Double-check the address. Crypto sent to wrong address cannot be recovered.', style: TextStyle(color: Colors.orange, fontSize: 12)),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _withdraw,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFef4444),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Withdraw BTC', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _assetChip(String asset, bool active) {
    final selected = _selectedAsset == asset && active;
    return GestureDetector(
      onTap: active ? () => setState(() => _selectedAsset = asset) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: !active ? Colors.grey.shade200 : selected ? const Color(0xFFef4444) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: !active ? Colors.grey.shade300 : selected ? const Color(0xFFef4444) : Colors.grey.shade300),
        ),
        child: Column(
          children: [
            Text(asset, style: TextStyle(color: !active ? Colors.grey : selected ? Colors.white : const Color(0xFF1a365d), fontWeight: FontWeight.bold, fontSize: 13)),
            if (!active) const Text('Soon', style: TextStyle(color: Colors.grey, fontSize: 9)),
          ],
        ),
      ),
    );
  }
}
