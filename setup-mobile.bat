@echo off
echo 🚀 Setting up BPay Mobile App...

cd mobile

echo 📦 Installing dependencies...
call npm install

echo 📱 Installing AsyncStorage...
call npx expo install @react-native-async-storage/async-storage

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. cd mobile
echo 2. npm start
echo 3. Scan QR code with Expo Go app
echo.
echo 📱 Your mobile app now has:
echo ✅ Complete authentication flow
echo ✅ Dashboard with live rates
echo ✅ Trading interface
echo ✅ Wallet management
echo ✅ Transaction history
echo ✅ Bottom navigation
echo ✅ Currency switching (NGN/KES)
echo ✅ Persistent storage

pause