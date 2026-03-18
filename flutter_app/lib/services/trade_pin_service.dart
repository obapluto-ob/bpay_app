import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'biometric_service.dart';

class TradePinService {
  static const _storage = FlutterSecureStorage();
  static const _keyPin = 'trade_pin_hash';
  static const _keySet = 'trade_pin_set';

  static String _hash(String pin) =>
      sha256.convert(utf8.encode(pin)).toString();

  static Future<bool> isPinSet() async {
    final val = await _storage.read(key: _keySet);
    return val == 'true';
  }

  static Future<void> setPin(String pin) async {
    await _storage.write(key: _keyPin, value: _hash(pin));
    await _storage.write(key: _keySet, value: 'true');
  }

  static Future<bool> verifyPin(String pin) async {
    final stored = await _storage.read(key: _keyPin);
    return stored == _hash(pin);
  }

  static Future<void> clearPin() async {
    await _storage.delete(key: _keyPin);
    await _storage.delete(key: _keySet);
  }

  /// Returns true if trade action is authorized.
  /// Tries biometrics first if available + enabled, falls back to PIN dialog via callback.
  static Future<bool> authorize({
    required Future<bool> Function() showPinDialog,
  }) async {
    final bioAvailable = await BiometricService.isAvailable();
    final bioEnabled = await BiometricService.isEnabled();

    if (bioAvailable && bioEnabled) {
      final result = await BiometricService.authenticate(
        reason: 'Confirm trade with biometrics',
      );
      if (result != null) return true;
      // biometric failed/cancelled — fall through to PIN
    }

    return showPinDialog();
  }
}
