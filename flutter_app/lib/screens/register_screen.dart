import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';
import 'dashboard_screen.dart';
export 'login_screen.dart' show _GoogleButton;

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String _country = 'NG';
  bool _loading = false;
  bool _showPassword = false;

  Future<void> _register() async {
    setState(() => _loading = true);
    try {
      final res = await AuthService.register(_nameCtrl.text.trim(), _emailCtrl.text.trim(), _passCtrl.text, _country);
      if (res['message'] != null || res['token'] != null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account created! Please login.'), backgroundColor: Colors.green));
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      } else {
        _showError(res['error'] ?? 'Registration failed');
      }
    } catch (e) {
      _showError('Network error. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _googleLogin() async {
    setState(() => _loading = true);
    try {
      final res = await AuthService.googleLogin();
      if (res['token'] != null) {
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        _showError(res['error'] ?? 'Google login failed');
      }
    } catch (e) {
      _showError('Google sign-in failed. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1a365d),
      body: Column(
        children: [
          // Top blue section
          Container(
            width: double.infinity,
            color: const Color(0xFF1a365d),
            padding: const EdgeInsets.only(top: 48, bottom: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 70,
                  height: 70,
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
                const SizedBox(height: 10),
                const Text('BPay', style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 4),
                const Text('Crypto to Cash Trading', style: TextStyle(color: Colors.white60, fontSize: 13)),
                const SizedBox(height: 12),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Text('🇳🇬', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 4),
                  const Text('Nigeria', style: TextStyle(color: Colors.white60, fontSize: 12)),
                  Container(margin: const EdgeInsets.symmetric(horizontal: 10), width: 1, height: 12, color: Colors.white30),
                  const Text('🇰🇪', style: TextStyle(fontSize: 14)),
                  const SizedBox(width: 4),
                  const Text('Kenya', style: TextStyle(color: Colors.white60, fontSize: 12)),
                ]),
              ],
            ),
          ),

          // Bottom white card
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
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                    child: Column(
                      children: [
                        const Text('Create Account', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                        const SizedBox(height: 16),
                        _inputField(_nameCtrl, 'Full Name', false),
                        const SizedBox(height: 10),
                        _inputField(_emailCtrl, 'Email', false, type: TextInputType.emailAddress),
                        const SizedBox(height: 10),
                        _passwordField(),
                        const SizedBox(height: 10),
                        Container(
                          decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: DropdownButton<String>(
                            value: _country,
                            isExpanded: true,
                            underline: const SizedBox(),
                            style: const TextStyle(color: Color(0xFF1a365d), fontSize: 14),
                            items: const [
                              DropdownMenuItem(value: 'NG', child: Text('🇳🇬  Nigeria (NGN)')),
                              DropdownMenuItem(value: 'KE', child: Text('🇰🇪  Kenya (KES)')),
                            ],
                            onChanged: (v) => setState(() => _country = v!),
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _register,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFf59e0b),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            child: _loading
                                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Text('Create Account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // Divider
                        Row(children: [
                          const Expanded(child: Divider(color: Color(0xFFdde3ea))),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or continue with', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.2)),
                          ),
                          const Expanded(child: Divider(color: Color(0xFFdde3ea))),
                        ]),
                        const SizedBox(height: 12),

                        // Google Sign-In button
                        _GoogleButton(onTap: _loading ? null : _googleLogin),
                        const SizedBox(height: 14),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Text('Already have an account? ', style: TextStyle(color: Colors.grey, fontSize: 13)),
                          GestureDetector(
                            onTap: () => Navigator.pop(context),
                            child: const Text('Login', style: TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.bold, fontSize: 13)),
                          ),
                        ]),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inputField(TextEditingController ctrl, String hint, bool obscure, {TextInputType type = TextInputType.text}) {
    return Container(
      decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
      child: TextField(
        controller: ctrl,
        obscureText: obscure,
        keyboardType: type,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _passwordField() {
    return Container(
      decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
      child: TextField(
        controller: _passCtrl,
        obscureText: !_showPassword,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Password',
          hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          suffixIcon: TextButton(
            onPressed: () => setState(() => _showPassword = !_showPassword),
            child: Text(_showPassword ? 'Hide' : 'Show', style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
        ),
      ),
    );
  }
}
