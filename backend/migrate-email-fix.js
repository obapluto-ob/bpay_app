const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addEmailVerificationColumns() {
  try {
    console.log('Adding email verification columns...');
    
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
    `);
    
    console.log('✅ Email verification columns added successfully!');
    
    const result = await db.query(`
      UPDATE users 
      SET email_verified = true 
      WHERE email_verified IS NULL OR email_verified = false;
    `);
    
    console.log(`✅ Updated ${result.rowCount} existing users to verified status`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await db.end();
  }
}

addEmailVerificationColumns();