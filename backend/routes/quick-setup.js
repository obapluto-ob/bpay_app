const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Quick database setup for email verification
router.get('/email-columns', async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)
    `);
    
    res.json({ success: true, message: 'Email verification columns added' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Test registration with email
router.post('/test-register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userId = 'user_' + Date.now();
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    await pool.query(
      'INSERT INTO users (id, email, password, first_name, last_name, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email',
      [userId, email, password, firstName, lastName, false]
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      user: { id: userId, email, fullName, emailVerified: false }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;