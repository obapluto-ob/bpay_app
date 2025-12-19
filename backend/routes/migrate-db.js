const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Database migration route
router.post('/migrate', async (req, res) => {
  try {
    console.log('Starting database migration...');
    
    // Add missing columns to users table
    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;'
    ];
    
    for (const migration of migrations) {
      try {
        await pool.query(migration);
        console.log('✅ Migration executed:', migration);
      } catch (error) {
        console.log('⚠️ Migration skipped (already exists):', migration);
      }
    }
    
    // Update existing users without verification tokens
    await pool.query(`
      UPDATE users 
      SET verification_token = 'legacy_' || id || '_' || EXTRACT(EPOCH FROM NOW())::text,
          email_verified = false
      WHERE verification_token IS NULL
    `);
    
    console.log('✅ Database migration completed');
    res.json({ success: true, message: 'Database migration completed successfully' });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: 'Migration failed', details: error.message });
  }
});

module.exports = router;