const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Verify Google ID token using Google's tokeninfo endpoint (no extra packages needed)
async function verifyGoogleToken(idToken) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw new Error('Invalid Google token');
  const data = await res.json();
  if (data.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error('Token audience mismatch');
  return data; // { sub, email, name, picture, email_verified }
}

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Google token required' });

    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser.email_verified || googleUser.email_verified === 'false') {
      return res.status(400).json({ error: 'Google account email not verified' });
    }

    const email = googleUser.email;
    const fullName = googleUser.name || email.split('@')[0];
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || firstName;

    // Find or create user
    let user;
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      user = existing.rows[0];
    } else {
      const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const result = await pool.query(
        `INSERT INTO users (id, email, password, first_name, last_name, email_verified)
         VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
        [userId, email, 'GOOGLE_AUTH_NO_PASSWORD', firstName, lastName]
      );
      user = result.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, verified: true },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        emailVerified: true,
        balances: {
          btc: parseFloat(user.btc_balance || 0),
          ngn: parseFloat(user.ngn_balance || 0),
          kes: parseFloat(user.kes_balance || 0),
        }
      }
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ error: 'Google authentication failed. Please try again.' });
  }
});

module.exports = router;
