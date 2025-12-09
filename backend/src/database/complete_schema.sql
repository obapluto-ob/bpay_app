-- BPay Complete Database Schema with All Required Tables

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('user_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    country VARCHAR(2) NOT NULL CHECK (country IN ('NG', 'KE')),
    preferred_currency VARCHAR(3) DEFAULT 'NGN',
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    btc_balance DECIMAL(20, 8) DEFAULT 0,
    eth_balance DECIMAL(20, 8) DEFAULT 0,
    usdt_balance DECIMAL(20, 8) DEFAULT 0,
    ngn_balance DECIMAL(20, 2) DEFAULT 0,
    kes_balance DECIMAL(20, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('admin_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'trade_admin', 'rate_admin', 'kyc_admin')),
    access_token VARCHAR(255) UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades table with unique 9-digit order IDs
CREATE TABLE IF NOT EXISTS trades (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('trade_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    order_id VARCHAR(9) UNIQUE NOT NULL DEFAULT LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0'),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
    crypto VARCHAR(10) NOT NULL CHECK (crypto IN ('BTC', 'ETH', 'USDT')),
    fiat_amount DECIMAL(20, 2) NOT NULL,
    crypto_amount DECIMAL(20, 8) NOT NULL,
    exchange_rate DECIMAL(20, 8),
    payment_method VARCHAR(50),
    payment_proof TEXT,
    country VARCHAR(2) NOT NULL CHECK (country IN ('NG', 'KE')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_verification', 'completed', 'rejected', 'cancelled', 'disputed')),
    assigned_admin VARCHAR(50) REFERENCES admins(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    rated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table
CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('deposit_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'NGN', 'KES')),
    amount DECIMAL(20, 8) NOT NULL,
    payment_proof TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages (user-admin trade chat)
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('msg_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    trade_id VARCHAR(50) REFERENCES trades(id) ON DELETE CASCADE,
    sender_id VARCHAR(50) NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin-to-admin chat messages
CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('admin_msg_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    sender_id VARCHAR(50) REFERENCES admins(id) ON DELETE CASCADE,
    receiver_id VARCHAR(50) REFERENCES admins(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('dispute_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    trade_id VARCHAR(50) REFERENCES trades(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
    admin_response TEXT,
    resolved_by VARCHAR(50) REFERENCES admins(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exchange rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('rate_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    crypto VARCHAR(10) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    rate DECIMAL(20, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_trade_id ON chat_messages(trade_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Insert default super admin (password: admin123)
INSERT INTO admins (id, name, email, password, role) 
VALUES ('admin_000000001', 'Super Admin', 'admin@bpay.com', '$2b$10$rKvVLZ8xqJ5xJ5xJ5xJ5xOqJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5x', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample exchange rates
INSERT INTO exchange_rates (crypto, currency, rate) VALUES
('BTC', 'NGN', 130012175),
('BTC', 'KES', 11592860),
('ETH', 'NGN', 4407045),
('ETH', 'KES', 392965),
('USDT', 'NGN', 1450),
('USDT', 'KES', 129)
ON CONFLICT DO NOTHING;
