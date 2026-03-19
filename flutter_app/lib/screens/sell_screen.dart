import 'package:flutter/material.dart';
import '../services/trade_service.dart';
import '../services/wallet_service.dart';
import 'chat_screen.dart';

class SellScreen extends StatefulWidget {
  final String token;
  final String country;
  final Map<String, dynamic> rates;
  final Map<String, dynamic> balance;
  const SellScreen({super.key, required this.token, required this.country, required this.rates, required this.balance});
  @override
  State<SellScreen> createState() => _SellScreenState();
}

class _SellScreenState extends State<SellScreen> {
  final _amountCtrl = TextEditingController();
  final _accountNameCtrl = TextEditingController();
  final _accountNumberCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  String _selectedCrypto = 'BTC';
  String _paymentMethod = 'bank';
  String _selectedCurrency = '';
  String _selectedWallet = '';
  bool _loading = false;
  String _orderStep = 'create';
  String? _escrowId;
  int _timeRemaining = 900;
  String? _depositAddress;

  bool get _isNG => widget.country == 'NG';
  String get _currency => _isNG ? '₦' : 'KSh';
  final List<String> _ngWallets = ['OPay', 'PalmPay', 'Kuda', 'Moniepoint'];
  final List<String> _keWallets = ['M-Pesa', 'Airtel Money', 'T-Kash'];

  @override
  void initState() {
    super.initState();
    _selectedCurrency = _isNG ? 'NGN' : 'KES';
  }

  double _getSellRate() {
    try {
      // Use Luno KES rate directly, apply 2% margin
      final btcKes = (widget.rates['rates']?['BTC']?['kes'] ?? widget.rates['btcKes'] ?? 0).toDouble();
      return btcKes * 0.98;
    } catch (_) { return 0; }
  }

  double get _btcBalance => (widget.balance['btc_balance'] ?? widget.balance['BTC'] ?? 0).toDouble();
  double get _cryptoAmount => double.tryParse(_amountCtrl.text) ?? 0;
  double get _fiatAmount => _cryptoAmount * _getSellRate();

  Future<void> _loadDepositAddress() async {
    try {
      final res = await WalletService.getAddress(widget.token, 'XBT');
      setState(() => _depositAddress = res['address']);
    } catch (_) {}
  }

  Future<void> _createOrder() async {
    if (_amountCtrl.text.isEmpty || _accountNameCtrl.text.isEmpty || _accountNumberCtrl.text.isEmpty || (_paymentMethod == 'bank' && _bankNameCtrl.text.isEmpty)) {
      _showSnack('Please fill all fields', Colors.red);
      return;
    }
    if (_cryptoAmount > _btcBalance) {
      _showSnack('Insufficient BTC balance', Colors.red);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await TradeService.createTrade(widget.token, {
        'type': 'sell',
        'crypto': _selectedCrypto,
        'cryptoAmount': _cryptoAmount,
        'fiatAmount': _fiatAmount,
        'paymentMethod': _paymentMethod,
        'country': widget.country,
        'bankDetails': {
          'accountName': _accountNameCtrl.text,
          'accountNumber': _accountNumberCtrl.text,
          'bankName': _paymentMethod == 'bank' ? _bankNameCtrl.text : _selectedWallet,
        }
      });
      if (res['trade'] != null) {
        setState(() { _escrowId = res['trade']['id'].toString(); _orderStep = 'escrow'; });
        _startTimer();
        await _loadDepositAddress();
      } else {
        _showSnack(res['error'] ?? 'Failed to create order', Colors.red);
      }
    } catch (_) { _showSnack('Network error', Colors.red); }
    setState(() => _loading = false);
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || _orderStep == 'create') return false;
      setState(() => _timeRemaining--);
      if (_timeRemaining <= 0) {
        setState(() => _orderStep = 'create');
        _showSnack('Order expired', Colors.red);
        return false;
      }
      return true;
    });
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  String _formatTime(int s) => '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(backgroundColor: const Color(0xFF1a365d), title: const Text('Sell Crypto', style: TextStyle(color: Colors.white)), iconTheme: const IconThemeData(color: Colors.white)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Crypto selector — BTC active, others coming soon
          const Text('Select Crypto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
          const SizedBox(height: 12),
          Row(children: [
            _cryptoChip('BTC', true),
            const SizedBox(width: 8),
            _comingSoonChip('ETH'),
            const SizedBox(width: 8),
            _comingSoonChip('USDT'),
          ]),
          const SizedBox(height: 16),

          // Balance
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF10b981).withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border(left: BorderSide(color: const Color(0xFF10b981), width: 4))),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Available BTC', style: TextStyle(color: Color(0xFF166534))),
              Text('${_btcBalance.toStringAsFixed(6)} BTC', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10b981))),
            ]),
          ),
          const SizedBox(height: 16),

          // Sell rate
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Sell Rate'),
              Text('$_currency${_getSellRate().toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b), fontSize: 16)),
            ]),
          ),
          const SizedBox(height: 16),

          // Amount input with MAX button
          Row(children: [
            Expanded(child: TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                labelText: 'BTC Amount to Sell',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFf59e0b))),
              ),
            )),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => setState(() => _amountCtrl.text = _btcBalance.toStringAsFixed(6)),
              child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16), decoration: BoxDecoration(color: const Color(0xFF10b981), borderRadius: BorderRadius.circular(12)), child: const Text('MAX', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
            ),
          ]),

          if (_cryptoAmount > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: const Color(0xFFf59e0b).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text("You'll receive"),
                Text('$_currency${_fiatAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFf59e0b), fontSize: 16)),
              ]),
            ),
          ],
          const SizedBox(height: 20),

          // Currency selector
          const Text('Receive Currency', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _currencyChip('NGN', '🇳🇬 Nigerian Naira')),
            const SizedBox(width: 12),
            Expanded(child: _currencyChip('KES', '🇰🇪 Kenyan Shilling')),
          ]),
          const SizedBox(height: 20),

          // Payment method
          const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _paymentChip('bank', 'Bank Account')),
            const SizedBox(width: 12),
            Expanded(child: _paymentChip('mobile', _selectedCurrency == 'NGN' ? 'Mobile Wallet' : 'Mobile Money')),
          ]),
          const SizedBox(height: 20),

          // Bank/Mobile details
          Text(_paymentMethod == 'bank' ? 'Bank Details' : 'Mobile Details', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
          const SizedBox(height: 12),
          TextField(controller: _accountNameCtrl, decoration: InputDecoration(labelText: _paymentMethod == 'bank' ? 'Account Name' : 'Full Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
          const SizedBox(height: 12),
          TextField(controller: _accountNumberCtrl, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: _paymentMethod == 'bank' ? 'Account Number' : 'Phone Number', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
          const SizedBox(height: 12),
          if (_paymentMethod == 'bank')
            TextField(controller: _bankNameCtrl, decoration: InputDecoration(labelText: 'Bank Name', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))))
          else ...[
            const Text('Select Provider:', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: (_selectedCurrency == 'NGN' ? _ngWallets : _keWallets).map((w) => GestureDetector(
              onTap: () => setState(() => _selectedWallet = w),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: _selectedWallet == w ? const Color(0xFF10b981) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _selectedWallet == w ? const Color(0xFF10b981) : Colors.grey.shade300),
                ),
                child: Text(w, style: TextStyle(color: _selectedWallet == w ? Colors.white : const Color(0xFF1a365d), fontWeight: FontWeight.bold)),
              ),
            )).toList()),
          ],

          // Escrow section
          if (_orderStep == 'escrow') ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFf0fdf4), borderRadius: BorderRadius.circular(12), border: Border(left: BorderSide(color: const Color(0xFF10b981), width: 4))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Order Created ✅', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF166534))),
                  Text(_formatTime(_timeRemaining), style: const TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 12),
                _detailRow('Order ID', '#$_escrowId'),
                _detailRow('BTC Amount', '${_cryptoAmount.toStringAsFixed(8)} BTC'),
                _detailRow('You Receive', '$_currency${_fiatAmount.toStringAsFixed(0)}'),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: ElevatedButton(
                  onPressed: () => setState(() => _orderStep = 'transfer'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10b981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Proceed to Transfer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )),
              ]),
            ),
          ],

          // Transfer section
          if (_orderStep == 'transfer') ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFfef3c7), borderRadius: BorderRadius.circular(12), border: Border(left: BorderSide(color: const Color(0xFFf59e0b), width: 4))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Send Your BTC', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF92400e))),
                const SizedBox(height: 12),
                const Text('Send BTC to our wallet:', style: TextStyle(color: Color(0xFF92400e))),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                  child: Text(_depositAddress ?? 'Loading address...', style: const TextStyle(fontFamily: 'monospace', fontSize: 12), textAlign: TextAlign.center),
                ),
                const SizedBox(height: 8),
                const Text('⚠️ Only send BTC to this address. Other coins will be lost permanently.', style: TextStyle(color: Color(0xFF92400e), fontSize: 12, fontStyle: FontStyle.italic)),
                const SizedBox(height: 12),
                SizedBox(width: double.infinity, child: ElevatedButton(
                  onPressed: () => setState(() => _orderStep = 'waiting'),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFf59e0b), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('I Have Sent the Crypto', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                )),
              ]),
            ),
          ],

          // Waiting section
          if (_orderStep == 'waiting') ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: const Color(0xFFdbeafe), borderRadius: BorderRadius.circular(12), border: Border(left: BorderSide(color: const Color(0xFF3b82f6), width: 4))),
              child: Column(children: [
                const Text('Transfer Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1e40af))),
                const SizedBox(height: 8),
                const Text('Your crypto transfer will be automatically detected by Luno. Chat with admin if you need help.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF1e40af), fontSize: 13)),
                const SizedBox(height: 16),
                Row(children: [
                  Expanded(child: ElevatedButton.icon(
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(token: widget.token, trade: {'id': _escrowId, 'type': 'sell', 'crypto': _selectedCrypto, 'fiat_amount': _fiatAmount, 'status': 'processing'}))),
                    icon: const Icon(Icons.chat, color: Colors.white),
                    label: const Text('Chat with Admin', style: TextStyle(color: Colors.white)),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10b981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: OutlinedButton(
                    onPressed: () => setState(() => _orderStep = 'create'),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: const Text('Cancel Order'),
                  )),
                ]),
              ]),
            ),
          ],

          if (_orderStep == 'create') ...[
            const SizedBox(height: 24),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: _loading ? null : _createOrder,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFef4444), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Lock Order & Proceed', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            )),
            const SizedBox(height: 12),
            const Text('Your crypto will be held in escrow until payment is processed. Funds released to your account within 1-24 hours.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ]),
      ),
    );
  }

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: Color(0xFF166534), fontSize: 13)),
      Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
    ]),
  );

  Widget _cryptoChip(String crypto, bool active) => GestureDetector(
    onTap: active ? () => setState(() => _selectedCrypto = crypto) : null,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(color: _selectedCrypto == crypto ? const Color(0xFFef4444) : Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFef4444))),
      child: Text(crypto, style: TextStyle(color: _selectedCrypto == crypto ? Colors.white : const Color(0xFFef4444), fontWeight: FontWeight.bold)),
    ),
  );

  Widget _comingSoonChip(String crypto) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(color: Colors.grey.shade200, borderRadius: BorderRadius.circular(20)),
    child: Column(children: [
      Text(crypto, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
      const Text('Soon', style: TextStyle(color: Colors.grey, fontSize: 9)),
    ]),
  );

  Widget _currencyChip(String currency, String label) {
    final selected = _selectedCurrency == currency;
    return GestureDetector(
      onTap: () => setState(() => _selectedCurrency = currency),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: selected ? const Color(0xFF10b981).withOpacity(0.1) : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: selected ? const Color(0xFF10b981) : Colors.grey.shade300)),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: selected ? const Color(0xFF10b981) : Colors.grey)),
      ),
    );
  }

  Widget _paymentChip(String method, String label) {
    final selected = _paymentMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = method),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: selected ? const Color(0xFFf59e0b).withOpacity(0.1) : Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: selected ? const Color(0xFFf59e0b) : Colors.grey.shade300)),
        child: Text(label, textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? const Color(0xFFf59e0b) : Colors.grey)),
      ),
    );
  }
}
