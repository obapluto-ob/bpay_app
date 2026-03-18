import 'package:flutter/material.dart';
import '../services/trade_service.dart';
import 'chat_screen.dart';

class BuyScreen extends StatefulWidget {
  final String token;
  final String country;
  final Map<String, dynamic> rates;
  const BuyScreen({super.key, required this.token, required this.country, required this.rates});
  @override
  State<BuyScreen> createState() => _BuyScreenState();
}

class _BuyScreenState extends State<BuyScreen> {
  final _amountCtrl = TextEditingController();
  String _selectedCrypto = 'BTC';
  String _paymentMethod = 'bank';
  bool _loading = false;

  bool get _isNG => widget.country == 'NG';
  String get _currency => _isNG ? '₦' : 'KSh';

  double _getBtcRate() {
    try {
      final usdRate = (widget.rates['bitcoin']?['usd'] ?? 0).toDouble();
      final fxRate = _isNG ? (widget.rates['usdNgn'] ?? 1580).toDouble() : (widget.rates['usdKes'] ?? 130).toDouble();
      return usdRate * fxRate;
    } catch (_) {
      return 0;
    }
  }

  Future<void> _createOrder() async {
    if (_amountCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final rate = _getBtcRate();
      final fiatAmount = double.parse(_amountCtrl.text);
      final cryptoAmount = rate > 0 ? fiatAmount / rate : 0;

      final res = await TradeService.createTrade(widget.token, {
        'type': 'buy',
        'crypto': _selectedCrypto,
        'fiatAmount': fiatAmount,
        'cryptoAmount': cryptoAmount,
        'paymentMethod': _paymentMethod,
        'country': widget.country,
      });

      if (res['trade'] != null) {
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(
          builder: (_) => ChatScreen(token: widget.token, trade: res['trade']),
        ));
      } else {
        _showError(res['error'] ?? 'Failed to create order');
      }
    } catch (e) {
      _showError('Network error');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    final rate = _getBtcRate();
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final cryptoPreview = rate > 0 ? amount / rate : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(backgroundColor: const Color(0xFF1a365d), title: const Text('Buy Crypto', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Select Crypto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
            const SizedBox(height: 12),
            Row(
              children: [
                _cryptoChip('BTC', true),
                const SizedBox(width: 8),
                _comingSoonChip('ETH'),
                const SizedBox(width: 8),
                _comingSoonChip('USDT'),
                const SizedBox(width: 8),
                _comingSoonChip('XRP'),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Live Rate', style: TextStyle(color: Color(0xFF1a365d))),
                  Text('$_currency${rate.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b), fontSize: 16)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _paymentChip('bank', _isNG ? 'Bank Transfer' : 'M-Pesa')),
                const SizedBox(width: 12),
                Expanded(child: _paymentChip('balance', 'Wallet Balance')),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'Amount in ${_isNG ? 'NGN' : 'KES'}',
                prefixText: _currency,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFf59e0b))),
              ),
            ),
            if (amount > 0) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: const Color(0xFF10b981).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("You'll receive"),
                    Text('${cryptoPreview.toStringAsFixed(8)} BTC', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10b981))),
                  ],
                ),
              ),
            ],
            if (_paymentMethod == 'bank') ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Payment Details', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                    const SizedBox(height: 8),
                    Text(_isNG ? 'Bank: First Bank Nigeria\nAccount: 0123456789\nName: BPay Technologies Ltd' : 'M-Pesa Paybill: 522522\nAccount: Your email\nBusiness: BPay Kenya', style: const TextStyle(color: Color(0xFF64748b), height: 1.6)),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _createOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10b981),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Create Buy Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _cryptoChip(String crypto, bool active) {
    return GestureDetector(
      onTap: () => setState(() => _selectedCrypto = crypto),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: _selectedCrypto == crypto ? const Color(0xFF10b981) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF10b981)),
        ),
        child: Text(crypto, style: TextStyle(color: _selectedCrypto == crypto ? Colors.white : const Color(0xFF10b981), fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _comingSoonChip(String crypto) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          Text(crypto, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
          const Text('Soon', style: TextStyle(color: Colors.grey, fontSize: 9)),
        ],
      ),
    );
  }

  Widget _paymentChip(String method, String label) {
    final selected = _paymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = method),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFf59e0b).withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? const Color(0xFFf59e0b) : Colors.grey.shade300),
        ),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? const Color(0xFFf59e0b) : Colors.grey)),
      ),
    );
  }
}
