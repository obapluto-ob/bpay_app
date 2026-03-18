import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/auth_service.dart';
import 'dashboard_screen.dart';
import 'register_screen.dart';

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

  Future<void> _login() async {
    setState(() { _loading = true; _loadingMsg = 'Logging in...'; });
    Future.delayed(const Duration(seconds: 3), () {
      if (_loading && mounted) setState(() => _loadingMsg = 'Waking up server...');
    });
    try {
      final res = await AuthService.login(_emailCtrl.text.trim(), _passCtrl.text);
      if (res['token'] != null) {
        if (!mounted) return;
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const DashboardScreen()));
      } else {
        _showError(res['error'] ?? 'Login failed');
      }
    } catch (e) {
      _showError('Network error. Please try again.');
    } finally {
      setState(() => _loading = false);
    }
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
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              color: const Color(0xFF1a365d),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 90,
                    height: 90,
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
                        const SizedBox(height: 20),
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
                        _GoogleButton(onTap: _loading ? null : _googleLogin),
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

class _GoogleButton extends StatefulWidget {
  final VoidCallback? onTap;
  const _GoogleButton({this.onTap});

  @override
  State<_GoogleButton> createState() => _GoogleButtonState();
}

class _GoogleButtonState extends State<_GoogleButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onTap?.call();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 100),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 13),
        decoration: BoxDecoration(
          color: _pressed ? const Color(0xFFF5F5F5) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFDDDDDD), width: 1),
          boxShadow: _pressed
              ? []
              : [BoxShadow(color: Colors.black.withOpacity(0.07), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _GoogleLogo(size: 20),
            const SizedBox(width: 10),
            const Text(
              'Continue with Google',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3C4043),
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleLogo extends StatelessWidget {
  final double size;
  const _GoogleLogo({required this.size});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final cx = w / 2;
    final cy = h / 2;
    final r = w / 2;

    // Draw colored arcs
    final segments = [
      // [startAngle, sweepAngle, color]
      [-1.047, 2.094, const Color(0xFF4285F4)],  // Blue (right)
      [1.047, 1.047, const Color(0xFF34A853)],   // Green (bottom-right)
      [2.094, 1.047, const Color(0xFFFBBC05)],   // Yellow (bottom-left)
      [3.141, 2.094, const Color(0xFFEA4335)],   // Red (left+top)
    ];

    for (final seg in segments) {
      final paint = Paint()
        ..color = seg[2] as Color
        ..style = PaintingStyle.fill;
      final path = Path()
        ..moveTo(cx, cy)
        ..arcTo(Rect.fromCircle(center: Offset(cx, cy), radius: r),
            seg[0] as double, seg[1] as double, false)
        ..close();
      canvas.drawPath(path, paint);
    }

    // White inner circle
    canvas.drawCircle(Offset(cx, cy), r * 0.6, Paint()..color = Colors.white);

    // Blue horizontal bar (the crossbar of the G)
    final barPaint = Paint()..color = const Color(0xFF4285F4);
    final barTop = cy - r * 0.13;
    final barBottom = cy + r * 0.13;
    canvas.drawRect(Rect.fromLTRB(cx, barTop, cx + r, barBottom), barPaint);

    // White inner circle again to clip the bar inside
    canvas.drawCircle(Offset(cx, cy), r * 0.58, Paint()..color = Colors.white);

    // Redraw blue bar only in right half outside inner circle
    final barPath = Path()
      ..addRect(Rect.fromLTRB(cx, barTop, cx + r, barBottom));
    final innerCirclePath = Path()
      ..addOval(Rect.fromCircle(center: Offset(cx, cy), radius: r * 0.58));
    final combined = Path.combine(PathOperation.difference, barPath, innerCirclePath);
    canvas.drawPath(combined, barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
