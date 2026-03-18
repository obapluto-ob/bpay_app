-- BPay SQLite/Turso Schema

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    country TEXT DEFAULT 'NG',
    kyc_status TEXT DEFAULT 'pending',
    is_verified INTEGER DEFAULT 0,
    document_type TEXT,
    document_number TEXT,
    security_question TEXT,
    security_answer TEXT,
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expires TEXT,
    btc_balance REAL DEFAULT 0,
    eth_balance REAL DEFAULT 0,
    usdt_balance REAL DEFAULT 0,
    ngn_balance REAL DEFAULT 0,
    kes_balance REAL DEFAULT 0,
    avatar TEXT,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    referral_earnings REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    crypto TEXT NOT NULL,
    fiat_amount REAL NOT NULL,
    crypto_amount REAL NOT NULL,
    currency TEXT,
    payment_method TEXT,
    country TEXT,
    status TEXT DEFAULT 'pending',
    payment_proof TEXT,
    assigned_admin TEXT,
    bank_details TEXT,
    admin_id TEXT,
    admin_notes TEXT,
    rating INTEGER,
    rating_comment TEXT,
    rated INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS deposits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    payment_method TEXT,
    reference TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'trade_admin',
    assigned_region TEXT DEFAULT 'ALL',
    permissions TEXT DEFAULT '[]',
    is_online INTEGER DEFAULT 0,
    last_active TEXT DEFAULT (datetime('now')),
    average_rating REAL DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    response_time INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    trade_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    admin_response TEXT,
    resolved_by TEXT,
    resolved_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    crypto TEXT NOT NULL,
    target_price REAL NOT NULL,
    condition TEXT NOT NULL,
    currency TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    triggered INTEGER DEFAULT 0,
    triggered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    referrer_id TEXT NOT NULL,
    referred_id TEXT NOT NULL UNIQUE,
    referral_code TEXT NOT NULL,
    reward_amount REAL DEFAULT 0,
    reward_paid INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    wallet_address TEXT,
    bank_details TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    processed_by TEXT,
    processed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crypto_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crypto TEXT UNIQUE NOT NULL,
    rate REAL NOT NULL,
    updated_at TEXT DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO crypto_rates (crypto, rate) VALUES ('BTC', 45000000);
INSERT OR IGNORE INTO crypto_rates (crypto, rate) VALUES ('ETH', 2850000);
INSERT OR IGNORE INTO crypto_rates (crypto, rate) VALUES ('USDT', 1580);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_disputes_trade_id ON disputes(trade_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_receiver ON admin_chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
