#!/bin/bash

echo "🚀 Setting up BPay Mobile App..."

# Navigate to mobile directory
cd mobile

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install AsyncStorage if not already installed
echo "📱 Installing AsyncStorage..."
npx expo install @react-native-async-storage/async-storage

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. cd mobile"
echo "2. npm start"
echo "3. Scan QR code with Expo Go app"
echo ""
echo "📱 Your mobile app now has:"
echo "✅ Complete authentication flow"
echo "✅ Dashboard with live rates"
echo "✅ Trading interface"
echo "✅ Wallet management"
echo "✅ Transaction history"
echo "✅ Bottom navigation"
echo "✅ Currency switching (NGN/KES)"
echo "✅ Persistent storage"