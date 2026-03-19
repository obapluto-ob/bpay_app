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
  static const _assets = [
    ('XBT',  'BTC',  'Bitcoin',      Color(0xFFf59e0b)),
    ('ETH',  'ETH',  'Ethereum',     Color(0xFF627EEA)),
    ('USDT', 'USDT', 'Tether',       Color(0xFF26A17B)),
    ('USDC', 'USDC', 'USD Coin',     Color(0xFF2775CA)),
    ('XRP',  'XRP',  'Ripple',       Color(0xFF346AA9)),
    ('SOL',  'SOL',  'Solana',       Color(0xFF9945FF)),
    ('TRX',  'TRX',  'Tron',         Color(0xFFEF0027)),
    ('BCH',  'BCH',  'Bitcoin Cash', Color(0xFF8DC351)),
  ];

  String? _selectedTicker; // null = asset list view
  String _paymentMethod = 'bank';
  final _amountCtrl = TextEditingController();
  bool _loading = false;

  bool get _isNG => widget.country == 'NG';
  String get _currency => _isNG ? '₦' : 'KSh';

  double _getRate(String ticker) {
    try {
      final r = (widget.rates['rates'] as Map?)?[ticker];
      if (r != null) return (r['kes'] as num).toDouble() * 1.02; // 2% buy spread
      return 0;
    } catch (_) { return 0; }
  }

  String _fmtRate(double n) {
    if (n == 0) return '—';
    if (n < 10)   return 'KSh${n.toStringAsFixed(4)}';
    if (n < 1000) return 'KSh${n.toStringAsFixed(2)}';
    return 'KSh${n.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}';
  }

  Future<void> _createOrder() async {
    if (_amountCtrl.text.isEmpty || _selectedTicker == null) return;
    setState(() => _loading = true);
    try {
      final rate = _getRate(_selectedTicker!);
      final fiatAmount = double.parse(_amountCtrl.text);
      final cryptoAmount = rate > 0 ? fiatAmount / rate : 0;
      final res = await TradeService.createTrade(widget.token, {
        'type': 'buy',
        'crypto': _selectedTicker,
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
    } catch (_) {
      _showError('Network error');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showError(String msg) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));

  Widget _logo(String ticker, {double size = 40}) {
    const colors = {
      'BTC': Color(0xFFf59e0b), 'ETH': Color(0xFF627EEA),
      'USDT': Color(0xFF26A17B), 'USDC': Color(0xFF2775CA),
      'XRP': Color(0xFF346AA9), 'SOL': Color(0xFF9945FF),
      'TRX': Color(0xFFEF0027), 'BCH': Color(0xFF8DC351),
    };
    final color = colors[ticker] ?? Colors.grey;
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.12)),
      child: ClipOval(child: Image.network(
        'https://api.bpayapp.co.ke/api/logos/$ticker',
        width: size, height: size, fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Center(child: Text(ticker[0],
            style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: size * 0.38))),
      )),
    );
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
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Row(children: [
                GestureDetector(
                  onTap: _selectedTicker != null
                      ? () => setState(() { _selectedTicker = null; _amountCtrl.clear(); })
                      : () => Navigator.pop(context),
                  child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(child: Text('Buy Crypto',
                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF10b981).withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                  child: const Text('Buy', style: TextStyle(color: Color(0xFF10b981), fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ]),
            ),
            // Body
            Expanded(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFFf1f5f9),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                ),
                child: _selectedTicker == null ? _buildAssetList() : _buildOrderForm(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssetList() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          const Text('Select Asset to Buy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
          const SizedBox(height: 4),
          const Text('Choose a cryptocurrency to purchase', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
          const SizedBox(height: 16),
          ..._assets.map((a) {
            final rate = _getRate(a.$2);
            return GestureDetector(
              onTap: () => setState(() => _selectedTicker = a.$2),
              child: Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
                ),
                child: Row(children: [
                  _logo(a.$2),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a.$2, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    Text(a.$3, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 12)),
                  ])),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text(_fmtRate(rate), style: TextStyle(color: a.$4, fontWeight: FontWeight.bold, fontSize: 14)),
                    const Text('per unit', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
                  ]),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right, color: a.$4, size: 20),
                ]),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildOrderForm() {
    final asset = _assets.firstWhere((a) => a.$2 == _selectedTicker!);
    final rate = _getRate(_selectedTicker!);
    final amount = double.tryParse(_amountCtrl.text) ?? 0;
    final cryptoPreview = rate > 0 ? amount / rate : 0.0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 8),
          // Selected asset card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
            child: Row(children: [
              _logo(_selectedTicker!, size: 48),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_selectedTicker!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                Text(asset.$3, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text(_fmtRate(rate), style: TextStyle(color: asset.$4, fontWeight: FontWeight.bold, fontSize: 16)),
                const Text('buy rate', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
              ]),
            ]),
          ),
          const SizedBox(height: 16),

          // Payment method
          const Text('Payment Method', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: _payChip('bank', _isNG ? 'Bank Transfer' : 'M-Pesa')),
            const SizedBox(width: 10),
            Expanded(child: _payChip('balance', 'Wallet Balance')),
          ]),
          const SizedBox(height: 16),

          // Amount input
          const Text('Amount', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0f172a))),
          const SizedBox(height: 10),
          TextField(
            controller: _amountCtrl,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Enter amount in ${_isNG ? 'NGN' : 'KES'}',
              prefixText: '$_currency ',
              filled: true, fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(color: asset.$4, width: 2)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),

          // Preview
          if (amount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: asset.$4.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text("You'll receive", style: TextStyle(color: Color(0xFF475569))),
                Text('${cryptoPreview.toStringAsFixed(8)} ${_selectedTicker!}',
                    style: TextStyle(fontWeight: FontWeight.bold, color: asset.$4, fontSize: 15)),
              ]),
            ),
          ],

          // Payment details
          if (_paymentMethod == 'bank') ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(14)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Payment Details', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1e293b))),
                const SizedBox(height: 8),
                Text(
                  _isNG
                      ? 'Bank: First Bank Nigeria\nAccount: 0123456789\nName: BPay Technologies Ltd'
                      : 'M-Pesa Paybill: 522522\nAccount: Your email\nBusiness: BPay Kenya',
                  style: const TextStyle(color: Color(0xFF64748b), height: 1.7, fontSize: 13),
                ),
              ]),
            ),
          ],

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading || amount <= 0 ? null : _createOrder,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10b981),
                disabledBackgroundColor: Colors.grey.shade300,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _loading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('Buy ${_selectedTicker!}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _payChip(String method, String label) {
    final selected = _paymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = method),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFf59e0b).withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: selected ? const Color(0xFFf59e0b) : Colors.grey.shade200, width: 1.5),
        ),
        child: Text(label, textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13,
                color: selected ? const Color(0xFFf59e0b) : const Color(0xFF64748b))),
      ),
    );
  }
}
