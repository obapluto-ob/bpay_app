const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Setup email verification columns
router.post('/setup', async (req, res) => {
  try {
    console.log('🔧 Setting up email verification columns...');
    
    // Add email verification columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
    `);
    
    console.log('✅ Email verification columns added');
    
    res.json({
      success: true,
      message: 'Email verification system setup complete',
      features: [
        'Registration verification emails',
        'Login notification emails', 
        'Password reset emails',
        'Email verification endpoints'
      ]
    });
  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;