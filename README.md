# BPay - Crypto to Cash Trading Platform

A secure fintech application for trading cryptocurrencies with Naira (NGN) and Kenyan Shillings (KES).

## 🚀 Features

- **Multi-Currency Support**: Trade BTC, ETH, USDT with NGN/KES
- **Manual Payment Processing**: Admin verification for secure transactions
- **KYC Verification**: Identity verification for compliance
- **2FA Security**: Two-factor authentication for enhanced security
- **Real-time Rates**: Live cryptocurrency exchange rates
- **Mobile Responsive**: Works seamlessly on all devices

## 🏗️ Architecture

```
bpay_app/
├── backend/          # Node.js/Express API
├── frontend/         # Next.js React app
├── shared/           # Shared types and utilities
└── docs/            # Documentation
```

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL database
- JWT authentication with 2FA
- Rate limiting and security middleware

**Frontend:**
- Next.js 14 + React 18
- Tailwind CSS for styling
- React Hook Form for forms
- React Query for API state management

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd bpay_app
npm install
```

2. **Setup environment variables:**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

3. **Setup database:**
```bash
# Create PostgreSQL database
createdb bpay_db

# Run migrations (to be created)
cd backend && npm run migrate
```

4. **Start development servers:**
```bash
npm run dev
```

This starts:
- Backend API: http://localhost:3001
- Frontend: http://localhost:3000

## 📋 Manual Payment Process

### For Users:
1. Create trade order
2. Make payment via bank transfer/mobile money
3. Upload payment proof
4. Wait for admin verification
5. Receive crypto/cash in wallet

### For Admins:
1. Review pending trades
2. Verify payment proofs
3. Approve/reject transactions
4. Process crypto transfers
5. Update trade status

## 🔐 Security Features

- JWT tokens with expiration
- Rate limiting (100 requests/15min)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- 2FA with TOTP
- KYC document verification

## 🌍 Supported Regions

- **Nigeria**: Naira (NGN) via bank transfers
- **Kenya**: Kenyan Shillings (KES) via M-Pesa/bank transfers

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify 2FA

### Trading
- `GET /api/trade/rates` - Get exchange rates
- `POST /api/trade/create` - Create trade
- `GET /api/trade/history` - Get trade history
- `POST /api/trade/:id/payment-proof` - Upload payment proof

### Admin
- `GET /api/admin/trades/pending` - Get pending trades
- `POST /api/admin/trades/:id/approve` - Approve trade
- `POST /api/admin/trades/:id/reject` - Reject trade

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (nginx)
5. Set up monitoring and logging

### Environment Variables
See `backend/.env.example` for all required variables.

## 📞 Support

For technical support or business inquiries:
- Email: support@bpay.com
- Documentation: `/docs`

## 🔄 Development Roadmap

### Phase 1 (Current): Manual Processing
- ✅ User registration and KYC
- ✅ Manual trade creation
- ✅ Admin verification system
- ✅ Basic wallet management

### Phase 2: Automation
- 🔄 Automated bank API integration
- 🔄 Real-time crypto transfers
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app development

### Phase 3: Scale
- 🔄 Multi-country expansion
- 🔄 Advanced trading features
- 🔄 Institutional accounts
- 🔄 API for third-party integration