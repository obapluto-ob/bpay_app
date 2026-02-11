const { Pool } = require('pg');

const neonDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XZA1C7yweMBG@ep-steep-grass-aiowntjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function setupNeonDatabase() {
  try {
    console.log('🔧 Setting up BPay database in Neon...\n');

    // Create users table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        country VARCHAR(10) DEFAULT 'NG',
        avatar TEXT,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        btc_balance DECIMAL(20,8) DEFAULT 0,
        eth_balance DECIMAL(20,8) DEFAULT 0,
        usdt_balance DECIMAL(20,8) DEFAULT 0,
        ngn_balance DECIMAL(15,2) DEFAULT 0,
        kes_balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');

    // Create trades table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL,
        crypto VARCHAR(10) NOT NULL,
        crypto_amount DECIMAL(20,8) NOT NULL,
        fiat_amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        country VARCHAR(10) NOT NULL,
        payment_method VARCHAR(50),
        bank_details TEXT,
        payment_proof TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_id VARCHAR(255),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Trades table created');

    // Create chat_messages table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        trade_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Chat messages table created');

    // Create admin_chat_messages table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS admin_chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admin chat messages table created');

    // Create crypto_rates table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS crypto_rates (
        id SERIAL PRIMARY KEY,
        crypto VARCHAR(10) UNIQUE NOT NULL,
        buy_rate DECIMAL(15,2) NOT NULL,
        sell_rate DECIMAL(15,2) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('✅ Crypto rates table created');

    // Insert default rates
    await neonDb.query(`
      INSERT INTO crypto_rates (crypto, buy_rate, sell_rate) VALUES
      ('BTC', 45250000, 44750000),
      ('ETH', 2850000, 2820000),
      ('USDT', 1580, 1570)
      ON CONFLICT (crypto) DO NOTHING
    `);
    console.log('✅ Default rates inserted');

    console.log('\n✅ Neon database setup complete!');
    console.log('\n📊 Database is ready for use');
    console.log('🔗 Connection string: postgresql://neondb_owner:***@ep-steep-grass-aiowntjq-pooler.c-4.us-east-1.aws.neon.tech/neondb');

  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await neonDb.end();
  }
}

setupNeonDatabase();