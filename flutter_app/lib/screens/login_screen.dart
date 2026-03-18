import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';
import '../widgets/google_button.dart';
import 'dashboard_screen.dart';
import 'register_screen.dart';
import 'forgot_password_screen.dart';
import 'security_question_setup_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _loading = false;
  bool _showPassword = false;
  String _loadingMsg = 'Logging in...';
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    final available = await BiometricService.isAvailable();
    final enabled = await BiometricService.isEnabled();
    if (mounted) setState(() { _biometricAvailable = available; _biometricEnabled = enabled; });
  }

  Future<void> _biometricLogin() async {
    setState(() { _loading = true; _loadingMsg = 'Authenticating...'; });
    try {
      final session = await BiometricService.authenticate(reason: 'Log in to BPay');
      if (session != null) {
        await AuthService.restoreSession(session['token']!, session['user']!);
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        _showError('Biometric authentication failed');
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _login() async {
    setState(() { _loading = true; _loadingMsg = 'Logging in...'; });
    Future.delayed(const Duration(seconds: 3), () {
      if (_loading && mounted) setState(() => _loadingMsg = 'Waking up server...');
    });
    try {
      final res = await AuthService.login(_emailCtrl.text.trim(), _passCtrl.text);
      if (res['token'] != null) {
        if (!mounted) return;
        // Offer to enable biometrics if available but not yet enabled
        if (_biometricAvailable && !_biometricEnabled) {
          _offerBiometricSetup(res['token'], res['user']);
        } else {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
        }
      } else {
        _showError(res['error'] ?? 'Login failed');
      }
    } catch (e) {
      _showError('Network error. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _offerBiometricSetup(String token, dynamic user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Enable Biometric Login?', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
        content: const Text('Use fingerprint or Face ID to log in faster next time.', style: TextStyle(fontSize: 13, color: Colors.grey)),
        actions: [
          TextButton(onPressed: () { Navigator.pop(context); Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen())); }, child: const Text('Skip')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFf59e0b), elevation: 0),
            onPressed: () async {
              await BiometricService.enableBiometrics(token, jsonEncode(user));
              if (!mounted) return;
              Navigator.pop(context);
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
            },
            child: const Text('Enable', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _googleLogin() async {
    setState(() { _loading = true; _loadingMsg = 'Connecting to Google...'; });
    Future.delayed(const Duration(seconds: 3), () {
      if (_loading && mounted) setState(() => _loadingMsg = 'Waking up server...');
    });
    try {
      final res = await AuthService.googleLogin();
      if (res['token'] != null) {
        if (!mounted) return;
        final hasQ = res['user']?['hasSecurityQuestion'] == true;
        if (!hasQ) {
          Navigator.pushReplacement(context, MaterialPageRoute(
            builder: (_) => SecurityQuestionSetupScreen(token: res['token']),
          ));
        } else {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
        }
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
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              color: const Color(0xFF1a365d),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 90, height: 90,
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: Center(
                      child: RichText(
                        text: const TextSpan(children: [
                          TextSpan(text: '₿', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFFf59e0b))),
                          TextSpan(text: 'pay', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                        ]),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('BPay', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 6),
                  const Text('Crypto to Cash Trading', style: TextStyle(color: Colors.white60, fontSize: 15)),
                  const SizedBox(height: 16),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Text('🇳🇬', style: TextStyle(fontSize: 16)),
                    const SizedBox(width: 4),
                    const Text('Nigeria', style: TextStyle(color: Colors.white60, fontSize: 13)),
                    Container(margin: const EdgeInsets.symmetric(horizontal: 12), width: 1, height: 14, color: Colors.white30),
                    const Text('🇰🇪', style: TextStyle(fontSize: 16)),
                    const SizedBox(width: 4),
                    const Text('Kenya', style: TextStyle(color: Colors.white60, fontSize: 13)),
                  ]),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 3,
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
                        const Text('Welcome Back', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
                        const SizedBox(height: 20),
                        Container(
                          decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
                          child: TextField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(fontSize: 14),
                            decoration: const InputDecoration(
                              hintText: 'Email',
                              hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
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
                        ),
                        const SizedBox(height: 6),
                        Align(
                          alignment: Alignment.centerRight,
                          child: GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(vertical: 4),
                              child: Text('Forgot password?', style: TextStyle(color: Color(0xFFf59e0b), fontSize: 13, fontWeight: FontWeight.w500)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _login,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFf59e0b),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              elevation: 0,
                            ),
                            child: _loading
                                ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                    const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                                    const SizedBox(width: 10),
                                    Text(_loadingMsg, style: const TextStyle(color: Colors.white, fontSize: 13)),
                                  ])
                                : const Text('Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(children: [
                          const Expanded(child: Divider(color: Color(0xFFdde3ea))),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: Text('or continue with', style: TextStyle(color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.2)),
                          ),
                          const Expanded(child: Divider(color: Color(0xFFdde3ea))),
                        ]),
                        const SizedBox(height: 14),
                        GoogleButton(onTap: _loading ? null : _googleLogin),
                        if (_biometricAvailable && _biometricEnabled) ...[  
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: _loading ? null : _biometricLogin,
                              icon: const Icon(Icons.fingerprint, color: Color(0xFF1a365d)),
                              label: const Text('Use Biometrics', style: TextStyle(color: Color(0xFF1a365d), fontWeight: FontWeight.w600)),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 13),
                                side: const BorderSide(color: Color(0xFF1a365d), width: 1.5),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 16),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Text("Don't have an account? ", style: TextStyle(color: Colors.grey, fontSize: 13)),
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
                            child: const Text('Sign Up', style: TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.bold, fontSize: 13)),
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
}
