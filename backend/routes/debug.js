const express = require('express');
const router = express.Router();

// Debug endpoint to test database and registration
router.post('/debug-register', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    console.log('Debug register called with:', req.body);

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected');

    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields', received: req.body });
    }

    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, email, password, first_name, last_name, email_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name',
      [userId, email, hashedPassword, firstName, lastName, true]
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: true },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    await pool.end();

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Debug register error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

module.exports = router;