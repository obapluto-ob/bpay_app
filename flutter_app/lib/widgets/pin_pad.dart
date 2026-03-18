import 'package:flutter/material.dart';

/// Shows a PIN pad dialog. Returns the entered PIN string or null if cancelled.
Future<String?> showPinPad(BuildContext context, {required String title, String? subtitle}) {
  return showDialog<String>(
    context: context,
    barrierDismissible: false,
    builder: (_) => _PinPadDialog(title: title, subtitle: subtitle),
  );
}

class _PinPadDialog extends StatefulWidget {
  final String title;
  final String? subtitle;
  const _PinPadDialog({required this.title, this.subtitle});
  @override
  State<_PinPadDialog> createState() => _PinPadDialogState();
}

class _PinPadDialogState extends State<_PinPadDialog> {
  String _pin = '';
  static const _len = 6;

  void _tap(String digit) {
    if (_pin.length >= _len) return;
    setState(() => _pin += digit);
    if (_pin.length == _len) {
      Future.delayed(const Duration(milliseconds: 120), () {
        if (mounted) Navigator.pop(context, _pin);
      });
    }
  }

  void _delete() {
    if (_pin.isEmpty) return;
    setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(widget.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1a365d))),
            if (widget.subtitle != null) ...[
              const SizedBox(height: 6),
              Text(widget.subtitle!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey, fontSize: 13)),
            ],
            const SizedBox(height: 24),
            // PIN dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_len, (i) => Container(
                margin: const EdgeInsets.symmetric(horizontal: 6),
                width: 14, height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: i < _pin.length ? const Color(0xFFf59e0b) : const Color(0xFFe8eef5),
                  border: Border.all(color: const Color(0xFFf59e0b), width: 1.5),
                ),
              )),
            ),
            const SizedBox(height: 24),
            // Number pad
            ...[ ['1','2','3'], ['4','5','6'], ['7','8','9'], ['','0','⌫'] ].map((row) =>
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: row.map((k) => _PinKey(
                    label: k,
                    onTap: k == '⌫' ? _delete : k.isEmpty ? null : () => _tap(k),
                  )).toList(),
                ),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, null),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
          ],
        ),
      ),
    );
  }
}

class _PinKey extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _PinKey({required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10),
        width: 60, height: 60,
        decoration: BoxDecoration(
          color: label == '⌫' ? Colors.transparent : const Color(0xFFf0f4f8),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: label == '⌫' ? 20 : 22,
              fontWeight: FontWeight.w600,
              color: label == '⌫' ? Colors.grey : const Color(0xFF1a365d),
            ),
          ),
        ),
      ),
    );
  }
}
