-- Simple BPay Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    country VARCHAR(2) DEFAULT 'NG',
    kyc_status VARCHAR(20) DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT FALSE,
    document_type VARCHAR(50),
    document_number VARCHAR(100),
    security_question VARCHAR(255),
    security_answer VARCHAR(255),
    btc_balance DECIMAL(20, 8) DEFAULT 0,
    eth_balance DECIMAL(20, 8) DEFAULT 0,
    usdt_balance DECIMAL(20, 8) DEFAULT 0,
    ngn_balance DECIMAL(20, 2) DEFAULT 0,
    kes_balance DECIMAL(20, 2) DEFAULT 0,
    avatar TEXT,
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(50),
    referral_earnings DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL,
    crypto VARCHAR(10) NOT NULL,
    fiat_amount DECIMAL(20, 2) NOT NULL,
    crypto_amount DECIMAL(20, 8) NOT NULL,
    payment_method VARCHAR(50),
    country VARCHAR(2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_proof TEXT,
    assigned_admin VARCHAR(50),
    bank_details JSONB,
    rating INTEGER,
    rating_comment TEXT,
    rated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    trade_id VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    sender_type VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'trade_admin',
    assigned_region VARCHAR(10) DEFAULT 'ALL',
    permissions TEXT[] DEFAULT '{}',
    is_online BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(50) PRIMARY KEY,
    trade_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    evidence TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    admin_response TEXT,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin chat messages table
CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    crypto VARCHAR(10) NOT NULL,
    target_price DECIMAL(20, 2) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
    currency VARCHAR(3) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(50) PRIMARY KEY,
    referrer_id VARCHAR(50) NOT NULL,
    referred_id VARCHAR(50) NOT NULL,
    referral_code VARCHAR(20) NOT NULL,
    reward_amount DECIMAL(20, 2) DEFAULT 0,
    reward_paid BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    wallet_address VARCHAR(255),
    bank_details JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    processed_by VARCHAR(50),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_disputes_trade_id ON disputes(trade_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_receiver ON admin_chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);