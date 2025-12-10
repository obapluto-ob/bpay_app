const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateChatTables() {
  try {
    console.log('Creating chat tables...');
    
    // Chat messages for trade conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        trade_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Admin to admin chat messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_trade_id ON chat_messages(trade_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_chat_sender ON admin_chat_messages(sender_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_chat_receiver ON admin_chat_messages(receiver_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_chat_created_at ON admin_chat_messages(created_at);`);

    console.log('✅ Chat tables created successfully!');
    
    // Test the tables
    const chatTest = await pool.query('SELECT COUNT(*) FROM chat_messages');
    const adminChatTest = await pool.query('SELECT COUNT(*) FROM admin_chat_messages');
    
    console.log(`📊 Chat messages: ${chatTest.rows[0].count}`);
    console.log(`📊 Admin messages: ${adminChatTest.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating chat tables:', error.message);
  } finally {
    await pool.end();
  }
}

migrateChatTables();