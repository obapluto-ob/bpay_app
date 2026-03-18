import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../services/trade_service.dart';
import '../config/api_config.dart';

class ChatScreen extends StatefulWidget {
  final String token;
  final Map<String, dynamic> trade;
  const ChatScreen({super.key, required this.token, required this.trade});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _disputeCtrl = TextEditingController();
  final _cancelCtrl = TextEditingController();
  List<Map<String, dynamic>> _messages = [];
  WebSocketChannel? _channel;
  bool _loading = true;
  bool _hasPaid = false;
  bool _uploadingProof = false;
  int _timeRemaining = 3600;
  int _rating = 0;
  bool _showRating = false;
  bool _showDispute = false;
  bool _showCancel = false;

  String get _tradeId => widget.trade['id'].toString();
  String get _status => widget.trade['status'] ?? 'pending';
  String get _adminName => widget.trade['adminName'] ?? widget.trade['admin_name'] ?? 'Admin';
  double get _adminRating => (widget.trade['adminRating'] ?? widget.trade['admin_rating'] ?? 4.5).toDouble();

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _connectWebSocket();
    _startTimer();
  }

  void _startTimer() {
    if (_status == 'pending' || _status == 'processing') {
      Future.doWhile(() async {
        await Future.delayed(const Duration(seconds: 1));
        if (!mounted) return false;
        setState(() => _timeRemaining--);
        if (_timeRemaining <= 0) {
          _showSnack('Trade expired due to inactivity', Colors.red);
          Navigator.pop(context);
          return false;
        }
        return true;
      });
    }
  }

  Future<void> _loadMessages() async {
    try {
      final msgs = await TradeService.getChatMessages(widget.token, _tradeId);
      setState(() { _messages = msgs.cast<Map<String, dynamic>>(); _loading = false; });
      _scrollToBottom();
    } catch (_) { setState(() => _loading = false); }
  }

  void _connectWebSocket() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse('${ApiConfig.wsUrl}?token=${widget.token}'));
      _channel!.stream.listen((data) {
        final msg = jsonDecode(data);
        if (msg['tradeId'].toString() == _tradeId) {
          setState(() => _messages.add(msg));
          _scrollToBottom();
          // Check for admin approval
          final text = (msg['message'] ?? '').toLowerCase();
          if (text.contains('credited') || text.contains('approved') || text.contains('confirmed')) {
            _showSuccessDialog();
          }
        }
      });
    } catch (_) {}
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    _msgCtrl.clear();
    try {
      await TradeService.sendChatMessage(widget.token, _tradeId, text);
      await _loadMessages();
    } catch (_) {}
  }

  Future<void> _markPaid() async {
    setState(() => _hasPaid = true);
    await _sendMessage('I have completed the payment for Order #$_tradeId. Uploading proof now...');
  }

  Future<void> _uploadProof() async {
    setState(() => _uploadingProof = true);
    try {
      final picker = ImagePicker();
      final img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
      if (img != null) {
        await _sendMessage('Payment proof uploaded. Please verify and credit my account.');
        _showSnack('Payment proof uploaded!', Colors.green);
      }
    } catch (_) {
      _showSnack('Failed to upload proof', Colors.red);
    }
    setState(() => _uploadingProof = false);
  }

  Future<void> _submitRating() async {
    if (_rating == 0) { _showSnack('Please select a rating', Colors.red); return; }
    setState(() => _showRating = false);
    _showSnack('Thank you for your feedback!', Colors.green);
  }

  Future<void> _submitDispute() async {
    if (_disputeCtrl.text.trim().isEmpty) { _showSnack('Please describe the issue', Colors.red); return; }
    await _sendMessage('DISPUTE: ${_disputeCtrl.text}');
    setState(() => _showDispute = false);
    _disputeCtrl.clear();
    _showSnack('Dispute raised. Admin will review shortly.', Colors.orange);
  }

  Future<void> _cancelOrder() async {
    if (_cancelCtrl.text.trim().isEmpty) { _showSnack('Please provide a reason', Colors.red); return; }
    try {
      await _sendMessage('Order cancelled by user. Reason: ${_cancelCtrl.text}');
      setState(() => _showCancel = false);
      _cancelCtrl.clear();
      _showSnack('Order cancelled', Colors.red);
      Navigator.pop(context);
    } catch (_) {}
  }

  void _showSuccessDialog() {
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('🎉 Trade Completed!', textAlign: TextAlign.center),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.check_circle, color: Colors.green, size: 64),
        const SizedBox(height: 16),
        Text('Your ${widget.trade['crypto'] ?? 'crypto'} has been credited to your wallet!', textAlign: TextAlign.center),
      ]),
      actions: [
        TextButton(onPressed: () { Navigator.pop(context); setState(() => _showRating = true); }, child: const Text('Rate Experience')),
        ElevatedButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); }, child: const Text('Done')),
      ],
    ));
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    });
  }

  void _showSnack(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  String _formatTime(int s) => '${(s ~/ 60).toString().padLeft(2, '0')}:${(s % 60).toString().padLeft(2, '0')}';

  Color _statusColor() {
    switch (_status) {
      case 'completed': return Colors.green;
      case 'processing': return Colors.blue;
      case 'disputed': return Colors.red;
      default: return Colors.orange;
    }
  }

  @override
  void dispose() {
    _channel?.sink.close();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _disputeCtrl.dispose();
    _cancelCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf8fafc),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1a365d),
        iconTheme: const IconThemeData(color: Colors.white),
        title: Row(children: [
          CircleAvatar(backgroundColor: const Color(0xFFf59e0b), child: Text(_adminName[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
          const SizedBox(width: 10),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(_adminName, style: const TextStyle(color: Colors.white, fontSize: 15)),
            Text('⭐ ${_adminRating.toStringAsFixed(1)}', style: const TextStyle(color: Color(0xFFfbbf24), fontSize: 12)),
          ]),
        ]),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: _statusColor(), borderRadius: BorderRadius.circular(12)),
            child: Text(_status.toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          if (_status == 'pending' || _status == 'processing')
            Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)),
              child: Text(_formatTime(_timeRemaining), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: Column(children: [
        _buildTradeInfo(),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: Color(0xFFf59e0b)))
              : _messages.isEmpty
                  ? const Center(child: Text('No messages yet', style: TextStyle(color: Colors.grey)))
                  : ListView.builder(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (_, i) => _buildMessage(_messages[i]),
                    ),
        ),
        _buildInput(),
        _buildActionButtons(),
      ]),
      // Modals
      bottomSheet: _showRating ? _buildRatingSheet() : _showDispute ? _buildDisputeSheet() : _showCancel ? _buildCancelSheet() : null,
    );
  }

  Widget _buildTradeInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: const Color(0xFF1a365d).withOpacity(0.05),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
        _infoChip('Type', (widget.trade['type'] ?? 'buy').toString().toUpperCase()),
        _infoChip('Crypto', widget.trade['crypto'] ?? 'BTC'),
        _infoChip('Amount', '${widget.trade['fiat_amount'] ?? widget.trade['fiatAmount'] ?? 0}'),
        _infoChip('Order', '#$_tradeId'),
      ]),
    );
  }

  Widget _infoChip(String label, String value) => Column(children: [
    Text(label, style: const TextStyle(color: Colors.grey, fontSize: 10)),
    Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1a365d))),
  ]);

  Widget _buildMessage(Map<String, dynamic> msg) {
    final isUser = msg['sender_type'] == 'user';
    final isSystem = msg['type'] == 'system';
    if (isSystem) {
      return Center(child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(color: const Color(0xFFfef3c7), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFf59e0b))),
        child: Text(msg['message'] ?? '', style: const TextStyle(color: Color(0xFF92400e), fontSize: 12, fontStyle: FontStyle.italic), textAlign: TextAlign.center),
      ));
    }
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? const Color(0xFF3b82f6) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
        ),
        child: Column(crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start, children: [
          Text(msg['message'] ?? '', style: TextStyle(color: isUser ? Colors.white : const Color(0xFF1a365d))),
          const SizedBox(height: 4),
          Text(
            msg['created_at'] != null ? _formatMsgTime(msg['created_at']) : 'Just now',
            style: TextStyle(color: isUser ? Colors.white60 : Colors.grey, fontSize: 10),
          ),
        ]),
      ),
    );
  }

  String _formatMsgTime(String ts) {
    try { return TimeOfDay.fromDateTime(DateTime.parse(ts)).format(context); } catch (_) { return ''; }
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, -2))]),
      child: Row(children: [
        Expanded(child: TextField(
          controller: _msgCtrl,
          maxLines: null,
          decoration: InputDecoration(
            hintText: 'Type a message...',
            filled: true,
            fillColor: Colors.grey.shade100,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          ),
        )),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => _sendMessage(_msgCtrl.text),
          child: Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(color: Color(0xFF1a365d), shape: BoxShape.circle), child: const Icon(Icons.send, color: Colors.white, size: 20)),
        ),
      ]),
    );
  }

  Widget _buildActionButtons() {
    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.white,
      child: Wrap(spacing: 8, runSpacing: 8, children: [
        if (!_hasPaid && _status == 'pending')
          _actionBtn('I Have Paid', Colors.green, _markPaid),
        if (_hasPaid && _status == 'pending')
          _actionBtn(_uploadingProof ? 'Uploading...' : 'Upload Proof', Colors.blue, _uploadingProof ? null : _uploadProof),
        if (_status == 'completed')
          _actionBtn('Rate Admin ⭐', Colors.amber, () => setState(() => _showRating = true)),
        if (_status == 'pending' || _status == 'processing')
          _actionBtn('Raise Dispute', Colors.red, () => setState(() => _showDispute = true)),
        if (_status == 'pending')
          _actionBtn('Cancel Order', Colors.grey, () => setState(() => _showCancel = true)),
      ]),
    );
  }

  Widget _actionBtn(String label, Color color, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(color: onTap == null ? Colors.grey.shade300 : color, borderRadius: BorderRadius.circular(20)),
        child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ),
    );
  }

  Widget _buildRatingSheet() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Rate Your Experience', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
        const SizedBox(height: 8),
        const Text('How was your experience with the admin?', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 20),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => GestureDetector(
          onTap: () => setState(() => _rating = i + 1),
          child: Padding(padding: const EdgeInsets.all(8), child: Icon(Icons.star, size: 40, color: i < _rating ? const Color(0xFFf59e0b) : Colors.grey.shade300)),
        ))),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => setState(() => _showRating = false), child: const Text('Cancel'))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(onPressed: _submitRating, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFf59e0b)), child: const Text('Submit', style: TextStyle(color: Colors.white)))),
        ]),
      ]),
    );
  }

  Widget _buildDisputeSheet() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Raise Dispute', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
        const SizedBox(height: 16),
        TextField(controller: _disputeCtrl, maxLines: 4, decoration: InputDecoration(hintText: 'Describe the problem...', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => setState(() => _showDispute = false), child: const Text('Cancel'))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(onPressed: _submitDispute, style: ElevatedButton.styleFrom(backgroundColor: Colors.red), child: const Text('Submit Dispute', style: TextStyle(color: Colors.white)))),
        ]),
      ]),
    );
  }

  Widget _buildCancelSheet() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('Cancel Order', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
        const SizedBox(height: 16),
        TextField(controller: _cancelCtrl, maxLines: 3, decoration: InputDecoration(hintText: 'Reason for cancellation...', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => setState(() => _showCancel = false), child: const Text('Keep Order'))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(onPressed: _cancelOrder, style: ElevatedButton.styleFrom(backgroundColor: Colors.red), child: const Text('Cancel Order', style: TextStyle(color: Colors.white)))),
        ]),
      ]),
    );
  }
}
