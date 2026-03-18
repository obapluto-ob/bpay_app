import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class BiometricService {
  static final _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage();

  static const _keyEnabled = 'biometric_enabled';
  static const _keyToken = 'biometric_token';
  static const _keyUser = 'biometric_user';

  /// Returns true if device hardware supports biometrics AND has enrolled biometrics
  static Future<bool> isAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      if (!canCheck || !isSupported) return false;
      final enrolled = await _auth.getAvailableBiometrics();
      return enrolled.isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  static Future<bool> isEnabled() async {
    final val = await _storage.read(key: _keyEnabled);
    return val == 'true';
  }

  /// Call after successful password login to save session for biometric reuse
  static Future<void> enableBiometrics(String token, String userJson) async {
    await _storage.write(key: _keyEnabled, value: 'true');
    await _storage.write(key: _keyToken, value: token);
    await _storage.write(key: _keyUser, value: userJson);
  }

  static Future<void> disableBiometrics() async {
    await _storage.deleteAll();
  }

  /// Prompt biometric and return stored session if success
  static Future<Map<String, String>?> authenticate({String reason = 'Confirm your identity'}) async {
    try {
      final ok = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: false, // allows PIN fallback on device
          stickyAuth: true,
        ),
      );
      if (!ok) return null;
      final token = await _storage.read(key: _keyToken);
      final user = await _storage.read(key: _keyUser);
      if (token == null || user == null) return null;
      return {'token': token, 'user': user};
    } on PlatformException {
      return null;
    }
  }
}
