const { Pool } = require('pg');

const neonDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XZA1C7yweMBG@ep-steep-grass-aiowntjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function createMissingTables() {
  try {
    console.log('Creating missing tables...\n');

    // Deposits table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Deposits table created');

    // Withdrawals table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        crypto VARCHAR(10),
        wallet_address TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Withdrawals table created');

    // Admins table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'admin',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Admins table created');

    // Referrals table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_id VARCHAR(255) NOT NULL,
        referred_id VARCHAR(255) NOT NULL,
        reward_amount DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Referrals table created');

    // Price alerts table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        crypto VARCHAR(10) NOT NULL,
        target_price DECIMAL(15,2) NOT NULL,
        condition VARCHAR(10) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Price alerts table created');

    // Disputes table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS disputes (
        id VARCHAR(255) PRIMARY KEY,
        trade_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        reason TEXT,
        evidence TEXT,
        status VARCHAR(20) DEFAULT 'open',
        admin_id VARCHAR(255),
        resolution TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Disputes table created');

    // Transactions table
    await neonDb.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Transactions table created');

    console.log('\n✅ All missing tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await neonDb.end();
  }
}

createMissingTables();