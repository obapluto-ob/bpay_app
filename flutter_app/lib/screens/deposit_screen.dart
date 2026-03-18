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
    setState(() => _loadingAddress = true);
    try {
      final res = await WalletService.getBtcAddress(widget.token);
      setState(() => _btcAddress = res['address']);
    } catch (_) {}
    setState(() => _loadingAddress = false);
  }

  Future<void> _initiateDeposit() async {
    if (_amountCtrl.text.isEmpty || (!_isNG && _phoneCtrl.text.isEmpty)) return;
    setState(() => _loadingDeposit = true);
    try {
      final res = await WalletService.initiateDeposit(widget.token, _amountCtrl.text, _phoneCtrl.text);
      if (!mounted) return;
      if (res['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Deposit initiated! Check your phone.'), backgroundColor: Colors.green));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['error'] ?? 'Failed'), backgroundColor: Colors.red));
      }
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error'), backgroundColor: Colors.red));
    }
    setState(() => _loadingDeposit = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a365d),
        title: const Text('Deposit', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFf59e0b),
          labelColor: const Color(0xFFf59e0b),
          unselectedLabelColor: Colors.white70,
          tabs: [Tab(text: 'Crypto (BTC)'), Tab(text: _isNG ? 'Bank Transfer' : 'M-Pesa')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildCryptoTab(), _buildFiatTab()],
      ),
    );
  }

  Widget _buildCryptoTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)]),
            child: Column(
              children: [
                const Icon(Icons.currency_bitcoin, size: 48, color: Color(0xFFf59e0b)),
                const SizedBox(height: 12),
                const Text('Your BTC Deposit Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
                const SizedBox(height: 16),
                if (_loadingAddress)
                  const CircularProgressIndicator(color: Color(0xFFf59e0b))
                else if (_btcAddress != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                    child: Row(
                      children: [
                        Expanded(child: Text(_btcAddress!, style: const TextStyle(fontFamily: 'monospace', fontSize: 12))),
                        IconButton(
                          icon: const Icon(Icons.copy, color: Color(0xFFf59e0b)),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: _btcAddress!));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Address copied!')));
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Send only BTC to this address.\nMinimum deposit: 0.0001 BTC', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13)),
                ] else
                  ElevatedButton(onPressed: _loadBtcAddress, child: const Text('Generate Address')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _comingSoonCard('ETH Deposits'),
          _comingSoonCard('USDT Deposits'),
          _comingSoonCard('XRP Deposits'),
        ],
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
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_isNG ? '🏦 Bank Transfer Details' : '📱 M-Pesa Details', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
                const SizedBox(height: 12),
                Text(
                  _isNG
                      ? 'Bank: First Bank Nigeria\nAccount: 0123456789\nName: BPay Technologies Ltd\nSort Code: 011151003'
                      : 'Paybill: 522522\nAccount: Your registered email\nBusiness: BPay Kenya',
                  style: const TextStyle(color: Color(0xFF64748b), height: 1.8),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _amountCtrl,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: _isNG ? 'Amount (NGN)' : 'Amount (KES)',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          if (!_isNG) ...[
            const SizedBox(height: 16),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'M-Pesa Phone (254...)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loadingDeposit ? null : _initiateDeposit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3b82f6),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _loadingDeposit
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(_isNG ? 'I Have Made Payment' : 'Send M-Pesa Prompt', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _comingSoonCard(String title) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          const Icon(Icons.lock_clock, color: Colors.grey),
          const SizedBox(width: 12),
          Text(title, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          const Spacer(),
          const Text('Coming Soon', style: TextStyle(color: Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }
}
