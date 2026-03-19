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
  final _amountCtrl       = TextEditingController();
  final _accountNameCtrl  = TextEditingController();
  final _accountNumberCtrl= TextEditingController();
  final _bankNameCtrl     = TextEditingController();

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

  String _selectedCrypto   = 'BTC';
  String _paymentMethod    = 'bank';
  String _selectedCurrency = 'KES';
  String _selectedWallet   = '';
  bool   _loading          = false;
  String _orderStep        = 'create';
  String? _escrowId;
  int    _timeRemaining    = 900;
  String? _depositAddress;

  String get _currency => _selectedCurrency == 'NGN' ? '₦' : 'KSh';
  final _ngWallets = ['OPay', 'PalmPay', 'Kuda', 'Moniepoint'];
  final _keWallets = ['M-Pesa', 'Airtel Money', 'T-Kash'];

  @override
  void initState() {
    super.initState();
    _selectedCurrency = widget.country == 'NG' ? 'NGN' : 'KES';
  }

  double _getRate(String ticker) {
    try {
      final kes = (widget.rates['rates']?[ticker]?['kes'] ?? 0).toDouble();
      if (ticker == 'BTC') {
        final btcKes = (widget.rates['btcKes'] ?? kes).toDouble();
        return btcKes * 0.98;
      }
      return kes * 0.98;
    } catch (_) { return 0; }
  }

  double get _cryptoBalance {
    final b = widget.balance[_selectedCrypto] ?? 0;
    return (b as num).toDouble();
  }

  double get _cryptoAmount => double.tryParse(_amountCtrl.text) ?? 0;
  double get _fiatAmount   => _cryptoAmount * _getRate(_selectedCrypto);

  String _fmt(double val, String ticker) {
    if (['USDT','USDC','TRX'].contains(ticker)) return val.toStringAsFixed(2);
    if (ticker == 'XRP') return val.toStringAsFixed(4);
    return val.toStringAsFixed(6);
  }

  Color get _assetColor => _assets.firstWhere((a) => a.$1 == _selectedCrypto).$4;

  Future<void> _loadDepositAddress() async {
    try {
      final luno = _assets.firstWhere((a) => a.$1 == _selectedCrypto).$3;
      final res  = await WalletService.getAddress(widget.token, luno);
      setState(() => _depositAddress = res['address']);
    } catch (_) {}
  }

  Future<void> _createOrder() async {
    if (_amountCtrl.text.isEmpty || _accountNameCtrl.text.isEmpty ||
        _accountNumberCtrl.text.isEmpty || (_paymentMethod == 'bank' && _bankNameCtrl.text.isEmpty)) {
      _snack('Please fill all fields', Colors.red); return;
    }
    if (_cryptoAmount > _cryptoBalance) {
      _snack('Insufficient $_selectedCrypto balance', Colors.red); return;
    }
    setState(() => _loading = true);
    try {
      final res = await TradeService.createTrade(widget.token, {
        'type': 'sell', 'crypto': _selectedCrypto,
        'cryptoAmount': _cryptoAmount, 'fiatAmount': _fiatAmount,
        'paymentMethod': _paymentMethod, 'country': widget.country,
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
        _snack(res['error'] ?? 'Failed to create order', Colors.red);
      }
    } catch (_) { _snack('Network error', Colors.red); }
    setState(() => _loading = false);
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted || _orderStep == 'create') return false;
      setState(() => _timeRemaining--);
      if (_timeRemaining <= 0) {
        setState(() => _orderStep = 'create');
        _snack('Order expired', Colors.red);
        return false;
      }
      return true;
    });
  }

  void _snack(String msg, Color color) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));

  String _formatTime(int s) =>
      '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

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
    final color = _assetColor;
    return Scaffold(
      backgroundColor: const Color(0xFF1e293b),
      body: SafeArea(
        child: Column(children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
            child: Row(children: [
              IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
              const Expanded(child: Text('Sell Crypto', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold))),
              if (_orderStep != 'create') Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFf59e0b), borderRadius: BorderRadius.circular(8)),
                child: Text(_formatTime(_timeRemaining), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              ),
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
                  const Text('Select Crypto', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0f172a))),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 72,
                    child: ListView(scrollDirection: Axis.horizontal, children: _assets.map((a) {
                      final sel = _selectedCrypto == a.$1;
                      return GestureDetector(
                        onTap: () => setState(() { _selectedCrypto = a.$1; _amountCtrl.clear(); }),
                        child: Container(
                          margin: const EdgeInsets.only(right: 10),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: sel ? a.$4 : Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: sel ? a.$4 : const Color(0xFFe2e8f0)),
                          ),
                          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            _logo(a.$1, a.$4, size: 24),
                            const SizedBox(height: 4),
                            Text(a.$1, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold,
                              color: sel ? Colors.white : const Color(0xFF0f172a))),
                          ]),
                        ),
                      );
                    }).toList()),
                  ),
                  const SizedBox(height: 16),

                  // Balance + rate row
                  Row(children: [
                    Expanded(child: _infoCard(
                      'Available', '${_fmt(_cryptoBalance, _selectedCrypto)} $_selectedCrypto',
                      Colors.green.shade50, Colors.green, Icons.account_balance_wallet_outlined,
                    )),
                    const SizedBox(width: 10),
                    Expanded(child: _infoCard(
                      'Sell Rate', '$_currency${_getRate(_selectedCrypto).toStringAsFixed(0)}',
                      Colors.amber.shade50, const Color(0xFFf59e0b), Icons.trending_down,
                    )),
                  ]),
                  const SizedBox(height: 16),

                  // Amount input
                  const Text('Amount to Sell', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0f172a))),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)]),
                    child: Row(children: [
                      Expanded(child: TextField(
                        controller: _amountCtrl,
                        keyboardType: TextInputType.number,
                        onChanged: (_) => setState(() {}),
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: '0.00',
                          hintStyle: const TextStyle(color: Color(0xFF94a3b8)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          suffixText: _selectedCrypto,
                          suffixStyle: TextStyle(color: color, fontWeight: FontWeight.bold),
                        ),
                      )),
                      GestureDetector(
                        onTap: () => setState(() => _amountCtrl.text = _fmt(_cryptoBalance, _selectedCrypto)),
                        child: Container(
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                          child: Text('MAX', style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ]),
                  ),

                  if (_cryptoAmount > 0) ...[ 
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: color.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        const Text("You'll receive", style: TextStyle(color: Color(0xFF475569), fontSize: 13)),
                        Text('$_currency${_fiatAmount.toStringAsFixed(0)}',
                          style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 16)),
                      ]),
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Currency
                  const Text('Receive Currency', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0f172a))),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: _chip('NGN', '🇳🇬 Naira',    _selectedCurrency == 'NGN', Colors.green,           () => setState(() => _selectedCurrency = 'NGN'))),
                    const SizedBox(width: 10),
                    Expanded(child: _chip('KES', '🇰🇪 Shilling', _selectedCurrency == 'KES', const Color(0xFF3b82f6), () => setState(() => _selectedCurrency = 'KES'))),
                  ]),
                  const SizedBox(height: 16),

                  // Payment method
                  const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0f172a))),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: _chip('bank',   '🏦 Bank',   _paymentMethod == 'bank',   const Color(0xFFf59e0b), () => setState(() => _paymentMethod = 'bank'))),
                    const SizedBox(width: 10),
                    Expanded(child: _chip('mobile', '📱 Mobile', _paymentMethod == 'mobile', const Color(0xFF8b5cf6), () => setState(() => _paymentMethod = 'mobile'))),
                  ]),
                  const SizedBox(height: 16),

                  // Payment details
                  const Text('Payment Details', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0f172a))),
                  const SizedBox(height: 8),
                  _inputField(_accountNameCtrl, _paymentMethod == 'bank' ? 'Account Name' : 'Full Name'),
                  const SizedBox(height: 10),
                  _inputField(_accountNumberCtrl, _paymentMethod == 'bank' ? 'Account Number' : 'Phone Number', type: TextInputType.number),
                  if (_paymentMethod == 'bank') ...[ 
                    const SizedBox(height: 10),
                    _inputField(_bankNameCtrl, 'Bank Name'),
                  ] else ...[ 
                    const SizedBox(height: 10),
                    Wrap(spacing: 8, runSpacing: 8,
                      children: (_selectedCurrency == 'NGN' ? _ngWallets : _keWallets).map((w) =>
                        GestureDetector(
                          onTap: () => setState(() => _selectedWallet = w),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: _selectedWallet == w ? const Color(0xFF8b5cf6) : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: _selectedWallet == w ? const Color(0xFF8b5cf6) : const Color(0xFFe2e8f0)),
                            ),
                            child: Text(w, style: TextStyle(
                              color: _selectedWallet == w ? Colors.white : const Color(0xFF475569),
                              fontWeight: FontWeight.w600, fontSize: 13)),
                          ),
                        ),
                      ).toList(),
                    ),
                  ],

                  // Order steps
                  if (_orderStep == 'escrow') ...[ const SizedBox(height: 20), _buildEscrow() ],
                  if (_orderStep == 'transfer') ...[ const SizedBox(height: 20), _buildTransfer() ],
                  if (_orderStep == 'waiting') ...[ const SizedBox(height: 20), _buildWaiting() ],

                  if (_orderStep == 'create') ...[ 
                    const SizedBox(height: 24),
                    SizedBox(width: double.infinity, child: ElevatedButton(
                      onPressed: _loading ? null : _createOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFef4444),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _loading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Text('Lock Order & Proceed', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                    )),
                    const SizedBox(height: 10),
                    const Text('Crypto held in escrow until payment confirmed. Released within 1–24 hours.',
                      textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF94a3b8), fontSize: 11)),
                  ],
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildEscrow() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.green.shade200)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('✅ Order Created', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF166534))),
      const SizedBox(height: 10),
      _detailRow('Order ID', '#$_escrowId'),
      _detailRow('Amount', '${_fmt(_cryptoAmount, _selectedCrypto)} $_selectedCrypto'),
      _detailRow('You Receive', '$_currency${_fiatAmount.toStringAsFixed(0)}'),
      const SizedBox(height: 12),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: () => setState(() => _orderStep = 'transfer'),
        style: ElevatedButton.styleFrom(backgroundColor: Colors.green, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), elevation: 0),
        child: const Text('Proceed to Transfer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      )),
    ]),
  );

  Widget _buildTransfer() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.amber.shade50, borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.amber.shade200)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Send $_selectedCrypto to our wallet', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF92400e))),
      const SizedBox(height: 10),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
        child: Text(_depositAddress ?? 'Loading address...', style: const TextStyle(fontFamily: 'monospace', fontSize: 12), textAlign: TextAlign.center),
      ),
      const SizedBox(height: 8),
      Text('⚠️ Only send $_selectedCrypto to this address.', style: const TextStyle(color: Color(0xFF92400e), fontSize: 12)),
      const SizedBox(height: 12),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: () => setState(() => _orderStep = 'waiting'),
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFf59e0b), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), elevation: 0),
        child: const Text('I Have Sent the Crypto', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      )),
    ]),
  );

  Widget _buildWaiting() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(14),
      border: Border.all(color: Colors.blue.shade200)),
    child: Column(children: [
      const Text('⏳ Verifying Transfer', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1e40af))),
      const SizedBox(height: 8),
      const Text('Transfer will be auto-detected by Luno. Chat with admin if you need help.',
        textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF1e40af), fontSize: 12)),
      const SizedBox(height: 12),
      Row(children: [
        Expanded(child: ElevatedButton.icon(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(
            token: widget.token,
            trade: {'id': _escrowId, 'type': 'sell', 'crypto': _selectedCrypto, 'fiat_amount': _fiatAmount, 'status': 'processing'},
          ))),
          icon: const Icon(Icons.chat, color: Colors.white, size: 16),
          label: const Text('Chat Admin', style: TextStyle(color: Colors.white, fontSize: 13)),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), elevation: 0),
        )),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton(
          onPressed: () => setState(() => _orderStep = 'create'),
          style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          child: const Text('Cancel', style: TextStyle(fontSize: 13)),
        )),
      ]),
    ]),
  );

  Widget _infoCard(String label, String value, Color bg, Color fg, IconData icon) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
    child: Row(children: [
      Icon(icon, color: fg, size: 18),
      const SizedBox(width: 8),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(color: fg.withOpacity(0.7), fontSize: 11)),
        Text(value, style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
      ])),
    ]),
  );

  Widget _chip(String val, String label, bool selected, Color color, VoidCallback onTap) =>
    GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.1) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: selected ? color : const Color(0xFFe2e8f0)),
        ),
        child: Text(label, textAlign: TextAlign.center,
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: selected ? color : const Color(0xFF64748b))),
      ),
    );

  Widget _inputField(TextEditingController ctrl, String hint, {TextInputType type = TextInputType.text}) =>
    Container(
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

  Widget _detailRow(String label, String value) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: const TextStyle(color: Color(0xFF166534), fontSize: 13)),
      Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0f172a), fontSize: 13)),
    ]),
  );
}
