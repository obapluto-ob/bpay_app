import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // Steps: 0=email, 1=security question, 2=new password, 3=done
  int _step = 0;
  bool _loading = false;

  final _emailCtrl = TextEditingController();
  final _answerCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  String? _question;
  String? _resetToken;
  bool _showPass = false;

  Future<void> _submitEmail() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty) return;
    setState(() => _loading = true);
    try {
      final res = await AuthService.getSecurityQuestion(email);
      if (res['question'] != null) {
        setState(() { _question = res['question']; _step = 1; });
      } else {
        _err(res['error'] ?? 'Email not found');
      }
    } catch (_) { _err('Network error'); }
    finally { setState(() => _loading = false); }
  }

  Future<void> _submitAnswer() async {
    final answer = _answerCtrl.text.trim();
    if (answer.isEmpty) return;
    setState(() => _loading = true);
    try {
      final res = await AuthService.verifySecurityAnswer(_emailCtrl.text.trim(), answer);
      if (res['resetToken'] != null) {
        setState(() { _resetToken = res['resetToken']; _step = 2; });
      } else {
        _err(res['error'] ?? 'Incorrect answer');
      }
    } catch (_) { _err('Network error'); }
    finally { setState(() => _loading = false); }
  }

  Future<void> _submitNewPassword() async {
    final pass = _newPassCtrl.text;
    if (pass.length < 6) { _err('Password must be at least 6 characters'); return; }
    if (pass != _confirmPassCtrl.text) { _err('Passwords do not match'); return; }
    setState(() => _loading = true);
    try {
      final res = await AuthService.resetPasswordWithToken(_resetToken!, pass);
      if (res['message'] != null) {
        setState(() => _step = 3);
      } else {
        _err(res['error'] ?? 'Reset failed');
      }
    } catch (_) { _err('Network error'); }
    finally { setState(() => _loading = false); }
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
              const Text('Reset Password', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(height: 8),
              // Step indicator
              Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(3, (i) =>
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _step.clamp(0, 2) ? 20 : 8, height: 8,
                  decoration: BoxDecoration(
                    color: i <= _step.clamp(0, 2) ? const Color(0xFFf59e0b) : Colors.white30,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              )),
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
                    child: [_emailStep(), _questionStep(), _newPasswordStep(), _doneStep()][_step],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _emailStep() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Find your account', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
    const SizedBox(height: 8),
    const Text('Enter your registered email address.', style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.5)),
    const SizedBox(height: 24),
    _field(_emailCtrl, 'Email address', Icons.email_outlined, TextInputType.emailAddress),
    const SizedBox(height: 20),
    _btn('Continue', _loading ? null : _submitEmail),
    _backLink(),
  ]);

  Widget _questionStep() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('Security Question', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
    const SizedBox(height: 8),
    Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
      child: Text(_question ?? '', style: const TextStyle(fontSize: 14, color: Color(0xFF1a365d), fontWeight: FontWeight.w500)),
    ),
    const SizedBox(height: 16),
    _field(_answerCtrl, 'Your answer', Icons.lock_outline),
    const SizedBox(height: 20),
    _btn('Verify Answer', _loading ? null : _submitAnswer),
    _backLink(onTap: () => setState(() { _step = 0; _answerCtrl.clear(); })),
  ]);

  Widget _newPasswordStep() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    const Text('New Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
    const SizedBox(height: 8),
    const Text('Choose a strong password (min 6 characters).', style: TextStyle(color: Colors.grey, fontSize: 13)),
    const SizedBox(height: 24),
    _field(_newPassCtrl, 'New password', Icons.lock_outline, TextInputType.text, obscure: !_showPass,
      suffix: TextButton(
        onPressed: () => setState(() => _showPass = !_showPass),
        child: Text(_showPass ? 'Hide' : 'Show', style: const TextStyle(color: Colors.grey, fontSize: 13)),
      ),
    ),
    const SizedBox(height: 12),
    _field(_confirmPassCtrl, 'Confirm password', Icons.lock_outline, TextInputType.text, obscure: true),
    const SizedBox(height: 20),
    _btn('Reset Password', _loading ? null : _submitNewPassword),
  ]);

  Widget _doneStep() => Column(children: [
    const SizedBox(height: 20),
    Container(
      width: 72, height: 72,
      decoration: const BoxDecoration(color: Color(0xFFe6f4ea), shape: BoxShape.circle),
      child: const Icon(Icons.check_circle_outline, color: Color(0xFF34A853), size: 40),
    ),
    const SizedBox(height: 20),
    const Text('Password Reset!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
    const SizedBox(height: 10),
    const Text('Your password has been updated.\nYou can now log in.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.6)),
    const SizedBox(height: 28),
    _btn('Back to Login', () => Navigator.pop(context)),
  ]);

  Widget _field(TextEditingController ctrl, String hint, IconData icon,
      [TextInputType type = TextInputType.text, bool obscure = false, Widget? suffix]) =>
    Container(
      decoration: BoxDecoration(color: const Color(0xFFe8eef5), borderRadius: BorderRadius.circular(10)),
      child: TextField(
        controller: ctrl,
        keyboardType: type,
        obscureText: obscure,
        style: const TextStyle(fontSize: 14),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          prefixIcon: Icon(icon, color: Colors.grey, size: 20),
          suffixIcon: suffix,
        ),
      ),
    );

  Widget _btn(String label, VoidCallback? onTap) => SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFFf59e0b),
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 0,
      ),
      child: _loading
          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
    ),
  );

  Widget _backLink({VoidCallback? onTap}) => Padding(
    padding: const EdgeInsets.only(top: 16),
    child: Center(
      child: GestureDetector(
        onTap: onTap ?? () => Navigator.pop(context),
        child: const Text('← Back', style: TextStyle(color: Color(0xFFf59e0b), fontWeight: FontWeight.w600, fontSize: 13)),
      ),
    ),
  );
}
