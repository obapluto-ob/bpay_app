import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  Future<void> _submit() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) return;
    setState(() => _loading = true);
    try {
      final res = await AuthService.forgotPassword(email);
      if (!mounted) return;
      if (res['message'] != null) {
        setState(() => _sent = true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['error'] ?? 'Failed to send reset email'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Network error. Please try again.'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a365d),
      body: Column(
        children: [
          // Top section
          Container(
            width: double.infinity,
            color: const Color(0xFF1a365d),
            padding: const EdgeInsets.only(top: 56, bottom: 28),
            child: Column(
              children: [
                Container(
                  width: 70, height: 70,
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: Center(
                    child: RichText(
                      text: const TextSpan(children: [
                        TextSpan(text: '₿', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFFf59e0b))),
                        TextSpan(text: 'pay', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                      ]),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Reset Password', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 6),
                const Text('We\'ll send you a reset link', style: TextStyle(color: Colors.white60, fontSize: 13)),
              ],
            ),
          ),

          // Bottom card
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
                    child: _sent ? _successView() : _formView(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _formView() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Forgot your password?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
        const SizedBox(height: 8),
        const Text(
          'Enter your email address and we\'ll send you a link to reset your password.',
          style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5),
        ),
        const SizedBox(height: 24),
        Container(
          decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
          child: TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(fontSize: 14),
            decoration: const InputDecoration(
              hintText: 'Email address',
              hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              prefixIcon: Icon(Icons.email_outlined, color: Colors.grey, size: 20),
            ),
          ),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFf59e0b),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: _loading
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Send Reset Link', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: const Text('← Back to Login', style: TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ),
      ],
    );
  }

  Widget _successView() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          width: 72, height: 72,
          decoration: BoxDecoration(color: const Color(0xFFe6f4ea), shape: BoxShape.circle),
          child: const Icon(Icons.mark_email_read_outlined, color: Color(0xFF34A853), size: 36),
        ),
        const SizedBox(height: 20),
        const Text('Check your email', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
        const SizedBox(height: 10),
        Text(
          'We sent a password reset link to\n${_emailCtrl.text.trim()}',
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.grey, fontSize: 13, height: 1.6),
        ),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFf59e0b),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text('Back to Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ],
    );
  }
}
