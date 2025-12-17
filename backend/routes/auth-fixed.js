const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const emailVerification = require('../services/email-verification');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName } = req.body;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    // Ensure users table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        country VARCHAR(10),
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        btc_balance DECIMAL(20,8) DEFAULT 0,
        eth_balance DECIMAL(20,8) DEFAULT 0,
        usdt_balance DECIMAL(20,8) DEFAULT 0,
        ngn_balance DECIMAL(15,2) DEFAULT 0,
        kes_balance DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const verificationToken = emailVerification.generateVerificationToken();

    // Create user
    const result = await pool.query(
      'INSERT INTO users (id, email, password, first_name, last_name, email_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name',
      [userId, email, hashedPassword, firstName, lastName, false, verificationToken]
    );

    const user = result.rows[0];

    // Send verification email
    const emailResult = await emailVerification.sendRegistrationVerification(email, fullName, verificationToken);

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: false },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully! Please verify your email to access all features.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: false
      },
      emailSent: emailResult.success,
      requiresVerification: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Send login notification
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const emailResult = await emailVerification.sendLoginVerification(
      user.email,
      `${user.first_name} ${user.last_name}`,
      ipAddress,
      userAgent
    );

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: user.email_verified || false },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: user.email_verified || false,
        balances: {
          btc: parseFloat(user.btc_balance || 0),
          eth: parseFloat(user.eth_balance || 0),
          usdt: parseFloat(user.usdt_balance || 0),
          ngn: parseFloat(user.ngn_balance || 0),
          kes: parseFloat(user.kes_balance || 0)
        }
      },
      loginNotificationSent: emailResult.success
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }
    
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE verification_token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Update user as verified
    await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1',
      [token]
    );
    
    const user = result.rows[0];
    res.json({
      message: 'Email verified successfully! You can now access all BPay features.',
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;