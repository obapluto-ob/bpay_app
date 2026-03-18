import 'dart:js_interop';
import 'dart:async';

@JS('googleSignIn')
external JSPromise _googleSignIn();

Future<String?> getGoogleIdTokenWeb() async {
  try {
    print('DEBUG: calling JS googleSignIn()');
    final result = await _googleSignIn().toDart;
    print('DEBUG: JS result type: ${result.runtimeType}, value: $result');
    final token = (result as JSString?)?.toDart;
    print('DEBUG: token extracted: ${token?.substring(0, 20)}...');
    return token;
  } catch (e) {
    print('DEBUG: getGoogleIdTokenWeb error: $e');
    return null;
  }
}
