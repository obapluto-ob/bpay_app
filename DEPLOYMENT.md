# BPay Deployment Guide

## 🚀 Deployment Architecture

### Backend (Render + PostgreSQL)
- **API**: Node.js/Express on Render
- **Database**: PostgreSQL on Render
- **Environment**: Production-ready with security

### Frontend (Vercel)
- **Web App**: Next.js on Vercel
- **Mobile**: React Native (Expo) for app stores

## 📋 Deployment Steps

### 1. Backend Deployment (Render)

```bash
# 1. Push to GitHub
git add .
git commit -m "Backend ready for deployment"
git push origin main

# 2. Create Render account and connect GitHub
# 3. Create PostgreSQL database on Render
# 4. Create Web Service on Render with these settings:
```

**Render Settings:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node.js
- **Instance Type**: Free tier

**Environment Variables:**
```
DATABASE_URL=postgresql://[render-postgres-url]
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Frontend Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from frontend directory
cd frontend
vercel --prod

# 3. Set environment variables in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

### 3. Mobile App Store Deployment

#### Free App Store Deployment Options:

**🍎 iOS App Store (FREE):**
1. **Apple Developer Account**: $99/year (required)
2. **Alternative**: Use **TestFlight** for beta testing (free)
3. **Expo Application Services (EAS)**: Free tier available

**🤖 Google Play Store (FREE):**
1. **Google Play Console**: $25 one-time fee
2. **Alternative**: Use **APK distribution** (completely free)

#### Steps for Free Deployment:

**Option 1: Expo EAS (Recommended)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android (FREE)
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

**Option 2: Direct APK (100% FREE)**
```bash
# Build APK locally
cd mobile
expo build:android --type apk

# Distribute APK directly to users
# No app store fees required
```

## 🔧 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  country VARCHAR(2) DEFAULT 'NG',
  kyc_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  crypto VARCHAR(10) NOT NULL, -- 'BTC', 'ETH', 'USDT'
  amount DECIMAL(15,2) NOT NULL,
  crypto_amount DECIMAL(20,8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  payment_proof TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Balances table
CREATE TABLE balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  btc DECIMAL(20,8) DEFAULT 0,
  eth DECIMAL(20,8) DEFAULT 0,
  usdt DECIMAL(10,2) DEFAULT 0,
  ngn DECIMAL(15,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🌐 URLs After Deployment

- **API**: `https://bpay-api.onrender.com`
- **Web App**: `https://bpay-app.vercel.app`
- **Mobile**: Available on app stores or direct APK

## 💰 Cost Breakdown

**FREE Tier:**
- Render: Free (with limitations)
- Vercel: Free (generous limits)
- PostgreSQL: Free tier on Render
- **Total: $0/month**

**Paid Options:**
- Google Play: $25 one-time
- Apple Developer: $99/year
- Render Pro: $7/month (better performance)

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention

## 📱 Mobile App Distribution

**Free Options:**
1. **Direct APK**: Share APK file directly
2. **GitHub Releases**: Host APK on GitHub
3. **Firebase App Distribution**: Free beta testing
4. **TestFlight**: iOS beta testing (free)

**Paid Options:**
1. **Google Play Store**: $25 one-time
2. **Apple App Store**: $99/year