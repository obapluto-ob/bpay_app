import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';

const _questions = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What is your mother\'s maiden name?',
  'What was the name of your primary school?',
  'What was the make of your first car?',
  'What is your oldest sibling\'s middle name?',
];

class SecurityQuestionSetupScreen extends StatefulWidget {
  final String token;
  const SecurityQuestionSetupScreen({super.key, required this.token});
  @override
  State<SecurityQuestionSetupScreen> createState() => _SecurityQuestionSetupScreenState();
}

class _SecurityQuestionSetupScreenState extends State<SecurityQuestionSetupScreen> {
  String _question = _questions[0];
  final _answerCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _save() async {
    final answer = _answerCtrl.text.trim();
    if (answer.length < 2) {
      _err('Please enter a valid answer');
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await AuthService.setSecurityQuestion(widget.token, _question, answer);
      if (res['message'] != null) {
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        _err(res['error'] ?? 'Failed to save');
      }
    } catch (_) {
      _err('Network error');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _err(String msg) => ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(msg), backgroundColor: Colors.red),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a365d),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            color: const Color(0xFF1a365d),
            padding: const EdgeInsets.only(top: 56, bottom: 28),
            child: Column(children: [
              Container(
                width: 70, height: 70,
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: Center(child: RichText(text: const TextSpan(children: [
                  TextSpan(text: '₿', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFFf59e0b))),
                  TextSpan(text: 'pay', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                ]))),
              ),
              const SizedBox(height: 12),
              const Text('One Last Step', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 6),
              const Text('Set up account recovery', style: TextStyle(color: Colors.white60, fontSize: 13)),
            ]),
          ),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFFf0f4f8),
                borderRadius: BorderRadius.only(topLeft: Radius.circular(32), topRight: Radius.circular(32)),
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 32),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Security Question', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                      const SizedBox(height: 8),
                      const Text(
                        'If you ever forget your password, we\'ll use this to verify it\'s you — no email needed.',
                        style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: DropdownButton<String>(
                          value: _question,
                          isExpanded: true,
                          underline: const SizedBox(),
                          style: const TextStyle(color: Color(0xFF1a365d), fontSize: 13),
                          items: _questions.map((q) => DropdownMenuItem(value: q, child: Text(q, overflow: TextOverflow.ellipsis))).toList(),
                          onChanged: (v) => setState(() => _question = v!),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Container(
                        decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
                        child: TextField(
                          controller: _answerCtrl,
                          style: const TextStyle(fontSize: 14),
                          decoration: const InputDecoration(
                            hintText: 'Your answer',
                            hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            prefixIcon: Icon(Icons.lock_outline, color: Colors.grey, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('Answer is case-insensitive and stored securely.', style: TextStyle(color: Colors.grey, fontSize: 11)),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _save,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFf59e0b),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: _loading
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Text('Save & Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Center(
                        child: GestureDetector(
                          onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen())),
                          child: const Text('Skip for now', style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ),
                      ),
                    ]),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
