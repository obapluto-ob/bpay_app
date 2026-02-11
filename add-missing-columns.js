const { Pool } = require('pg');

const neonDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XZA1C7yweMBG@ep-steep-grass-aiowntjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to users table...\n');

    await neonDb.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS kyc_documents TEXT,
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS referred_by VARCHAR(255)
    `);

    console.log('✅ Missing columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await neonDb.end();
  }
}

addMissingColumns();