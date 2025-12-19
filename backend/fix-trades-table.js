const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixTradesTable() {
  try {
    console.log('Adding missing currency column to trades table...');
    
    await db.query(`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NGN';
    `);
    
    console.log('✅ Currency column added successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await db.end();
  }
}

fixTradesTable();