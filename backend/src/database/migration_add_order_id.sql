-- Migration: Add order_id and create missing tables

-- Add order_id column to trades if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trades' AND column_name='order_id') THEN
        ALTER TABLE trades ADD COLUMN order_id VARCHAR(9) UNIQUE;
    END IF;
END $$;

-- Update existing trades with unique 9-digit order IDs
UPDATE trades 
SET order_id = LPAD(FLOOR(100000000 + RANDOM() * 900000000)::TEXT, 9, '0')
WHERE order_id IS NULL;

-- Make order_id NOT NULL after populating
ALTER TABLE trades ALTER COLUMN order_id SET NOT NULL;

-- Create admins table if not exists
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

-- Create deposits table if not exists
CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('deposit_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    user_id VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'NGN', 'KES')),
    amount DECIMAL(20, 8) NOT NULL,
    payment_proof TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table if not exists
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('msg_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    trade_id VARCHAR(50) NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin_chat_messages table if not exists
CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('admin_msg_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    sender_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create disputes table if not exists
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(50) PRIMARY KEY DEFAULT ('dispute_' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')),
    trade_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
    admin_response TEXT,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add balance columns to users if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='btc_balance') THEN
        ALTER TABLE users ADD COLUMN btc_balance DECIMAL(20, 8) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='eth_balance') THEN
        ALTER TABLE users ADD COLUMN eth_balance DECIMAL(20, 8) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='usdt_balance') THEN
        ALTER TABLE users ADD COLUMN usdt_balance DECIMAL(20, 8) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='ngn_balance') THEN
        ALTER TABLE users ADD COLUMN ngn_balance DECIMAL(20, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='kes_balance') THEN
        ALTER TABLE users ADD COLUMN kes_balance DECIMAL(20, 2) DEFAULT 0;
    END IF;
END $$;

-- Add missing columns to trades if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trades' AND column_name='assigned_admin') THEN
        ALTER TABLE trades ADD COLUMN assigned_admin VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trades' AND column_name='rating') THEN
        ALTER TABLE trades ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trades' AND column_name='rating_comment') THEN
        ALTER TABLE trades ADD COLUMN rating_comment TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='trades' AND column_name='rated') THEN
        ALTER TABLE trades ADD COLUMN rated BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_trade_id ON chat_messages(trade_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- Insert default super admin if not exists (password: admin123 - hashed with bcrypt)
INSERT INTO admins (id, name, email, password, role) 
VALUES ('admin_000000001', 'Super Admin', 'admin@bpay.com', '$2b$10$rKvVLZ8xqJ5xJ5xJ5xJ5xOqJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5x', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Migration completed successfully! All tables created and order_id added to trades.' as status;
