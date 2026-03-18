import 'package:flutter/material.dart';
import '../services/trade_service.dart';
import 'chat_screen.dart';

class TradeHistoryScreen extends StatefulWidget {
  final String token;
  const TradeHistoryScreen({super.key, required this.token});
  @override
  State<TradeHistoryScreen> createState() => _TradeHistoryScreenState();
}

class _TradeHistoryScreenState extends State<TradeHistoryScreen> {
  List _trades = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final trades = await TradeService.getHistory(widget.token);
      setState(() { _trades = trades; _loading = false; });
    } catch (_) { setState(() => _loading = false); }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed': return Colors.green;
      case 'pending_payment':
      case 'pending': return Colors.orange;
      case 'payment_uploaded':
      case 'processing': return Colors.blue;
      case 'verifying': return Colors.purple;
      case 'disputed': return Colors.red;
      case 'cancelled': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusText(String status) {
    switch (status) {
      case 'pending_payment': return 'Awaiting Payment';
      case 'payment_uploaded': return 'Payment Uploaded';
      case 'verifying': return 'Verifying';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'disputed': return 'Disputed';
      default: return status.toUpperCase();
    }
  }

  bool _canChat(String status) => ['processing', 'payment_uploaded', 'verifying', 'pending'].contains(status);
  bool _canRate(String status) => status == 'completed';
  bool _isCancelled(String status) => status == 'cancelled';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a365d),
        title: const Text('Trade History', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _load)],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFf59e0b)))
          : _trades.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.history, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text('No trades yet', style: TextStyle(color: Colors.grey, fontSize: 16)),
                  const SizedBox(height: 8),
                  const Text('Start trading to see your history here', style: TextStyle(color: Colors.grey, fontSize: 13)),
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _trades.length,
                    itemBuilder: (_, i) => _buildTradeCard(_trades[i] as Map<String, dynamic>),
                  ),
                ),
    );
  }

  Widget _buildTradeCard(Map<String, dynamic> t) {
    final status = t['status'] ?? 'pending';
    final type = (t['type'] ?? 'buy').toString().toUpperCase();
    final crypto = t['crypto'] ?? 'BTC';
    final fiatAmount = t['fiat_amount'] ?? t['fiatAmount'] ?? 0;
    final cryptoAmount = t['crypto_amount'] ?? t['cryptoAmount'] ?? 0;
    final currency = t['currency'] ?? 'NGN';
    final createdAt = t['created_at'] ?? t['createdAt'];
    final adminNotes = t['admin_notes'] ?? t['adminNotes'];
    final isCancelled = _isCancelled(status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isCancelled ? const Color(0xFFfef2f2) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: isCancelled ? Border.all(color: const Color(0xFFfecaca)) : null,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Header
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: type == 'BUY' ? const Color(0xFF10b981).withOpacity(0.1) : const Color(0xFFef4444).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(type == 'BUY' ? Icons.arrow_downward : Icons.arrow_upward, color: type == 'BUY' ? const Color(0xFF10b981) : const Color(0xFFef4444), size: 16),
              ),
              const SizedBox(width: 8),
              Text('$type $crypto', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1a365d))),
            ]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: _statusColor(status).withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
              child: Text(_statusText(status), style: TextStyle(color: _statusColor(status), fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ]),
          const SizedBox(height: 12),

          // Amounts
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('${type == 'BUY' ? 'Paid' : 'Received'}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text('$currency $fiatAmount', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1a365d))),
            ]),
            Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('${type == 'BUY' ? 'Received' : 'Sent'}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text('$cryptoAmount $crypto', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1a365d))),
            ]),
          ]),

          if (createdAt != null) ...[
            const SizedBox(height: 8),
            Text(_formatDate(createdAt.toString()), style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],

          // Cancel reason
          if (isCancelled && adminNotes != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFfee2e2), borderRadius: BorderRadius.circular(8), border: Border(left: BorderSide(color: Colors.red, width: 3))),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Cancellation Reason:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF991b1b))),
                const SizedBox(height: 4),
                Text(adminNotes.toString(), style: const TextStyle(fontSize: 13, color: Color(0xFF7f1d1d))),
              ]),
            ),
          ],

          // Action buttons
          const SizedBox(height: 12),
          Row(children: [
            if (_canChat(status))
              Expanded(child: _actionBtn('Chat with Admin', const Color(0xFF3b82f6), Icons.chat, () => _openChat(t))),
            if (_canChat(status) && _canRate(status)) const SizedBox(width: 8),
            if (_canRate(status))
              Expanded(child: _actionBtn('Rate Experience', const Color(0xFF10b981), Icons.star, () => _openChat(t))),
          ]),
        ]),
      ),
    );
  }

  Widget _actionBtn(String label, Color color, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: color.withOpacity(0.3))),
        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
        ]),
      ),
    );
  }

  void _openChat(Map<String, dynamic> trade) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(token: widget.token, trade: {
      ...trade,
      'adminName': trade['admin_name'] ?? trade['adminName'] ?? 'System Admin',
      'adminRating': trade['admin_rating'] ?? trade['adminRating'] ?? 4.5,
    })));
  }

  String _formatDate(String dateStr) {
    try {
      final d = DateTime.parse(dateStr);
      return '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) { return dateStr; }
  }
}
