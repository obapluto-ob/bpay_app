const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

// Test auth endpoints
router.get('/auth', (req, res) => {
  res.json({
    success: true,
    message: 'Auth system ready',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      forgotPassword: 'POST /api/auth/forgot-password',
      resetPassword: 'POST /api/auth/reset-password'
    }
  });
});

// Test admin endpoints
router.get('/admin', (req, res) => {
  res.json({
    success: true,
    message: 'Admin system ready',
    endpoints: {
      trades: 'GET /api/admin/trades/pending',
      users: 'GET /api/admin/users',
      chat: 'GET /api/admin/chat/messages'
    }
  });
});

// Test database connection
router.get('/database', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      success: true,
      message: 'Database connected',
      timestamp: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test user registration (simple)
router.post('/register-test', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple user creation for testing
    const userId = 'user_' + Date.now();
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        country VARCHAR(10) DEFAULT 'NG',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      'INSERT INTO users (id, email, password, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
      [userId, email, password, firstName, lastName]
    );

    res.json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;