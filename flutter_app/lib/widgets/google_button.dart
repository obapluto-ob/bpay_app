import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class GoogleButton extends StatefulWidget {
  final VoidCallback? onTap;
  const GoogleButton({super.key, this.onTap});

  @override
  State<GoogleButton> createState() => _GoogleButtonState();
}

class _GoogleButtonState extends State<GoogleButton> {
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
            SizedBox(width: 20, height: 20, child: CustomPaint(painter: _GoogleLogoPainter())),
            const SizedBox(width: 10),
            const Text(
              'Continue with Google',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF3C4043), letterSpacing: 0.1),
            ),
          ],
        ),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2;

    final segments = [
      [-1.047, 2.094, const Color(0xFF4285F4)],
      [1.047, 1.047, const Color(0xFF34A853)],
      [2.094, 1.047, const Color(0xFFFBBC05)],
      [3.141, 2.094, const Color(0xFFEA4335)],
    ];

    for (final seg in segments) {
      final paint = Paint()..color = seg[2] as Color..style = PaintingStyle.fill;
      final path = Path()
        ..moveTo(cx, cy)
        ..arcTo(Rect.fromCircle(center: Offset(cx, cy), radius: r), seg[0] as double, seg[1] as double, false)
        ..close();
      canvas.drawPath(path, paint);
    }

    canvas.drawCircle(Offset(cx, cy), r * 0.6, Paint()..color = Colors.white);

    final barTop = cy - r * 0.13;
    final barBottom = cy + r * 0.13;
    final barPath = Path()..addRect(Rect.fromLTRB(cx, barTop, cx + r, barBottom));
    final innerPath = Path()..addOval(Rect.fromCircle(center: Offset(cx, cy), radius: r * 0.58));
    canvas.drawPath(
      Path.combine(PathOperation.difference, barPath, innerPath),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
