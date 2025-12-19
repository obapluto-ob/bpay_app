const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Admin route to verify users manually (temporary solution for email issues)
router.post('/verify-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE email = $1 RETURNING id, email, first_name, last_name',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User verified successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Manual verify error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// Get all unverified users
router.get('/unverified-users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, created_at FROM users WHERE email_verified = false ORDER BY created_at DESC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get unverified users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;