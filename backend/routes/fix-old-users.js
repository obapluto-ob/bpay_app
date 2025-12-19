const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Fix old users without email verification
router.post('/fix-old-users', async (req, res) => {
  try {
    // Update all users without verification_token to have one
    const result = await pool.query(`
      UPDATE users 
      SET verification_token = 'legacy_' || id || '_' || EXTRACT(EPOCH FROM NOW())::text,
          email_verified = false
      WHERE verification_token IS NULL OR verification_token = ''
      RETURNING id, email, first_name, last_name
    `);

    res.json({
      message: `Fixed ${result.rows.length} old user accounts`,
      users: result.rows
    });
  } catch (error) {
    console.error('Fix old users error:', error);
    res.status(500).json({ error: 'Failed to fix old users' });
  }
});

// Manually verify a user (admin function)
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

module.exports = router;