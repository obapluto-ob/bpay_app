const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const emailVerification = require('../services/email-verification');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Check if email exists
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    res.json({ exists: result.rows.length > 0 });
  } catch (error) {
    res.json({ exists: false });
  }
});

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      if (firstError.path === 'email') return res.status(400).json({ error: 'Please enter a valid email address' });
      if (firstError.path === 'password') return res.status(400).json({ error: 'Password must be at least 6 characters' });
      if (firstError.path === 'fullName') return res.status(400).json({ error: 'Please enter your full name' });
      return res.status(400).json({ error: 'Please check your information and try again' });
    }

    const { email, password, fullName, cfToken } = req.body;
    
    // Verify Cloudflare Turnstile
    if (cfToken) {
      try {
        const cfResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: process.env.CLOUDFLARE_SECRET_KEY,
            response: cfToken
          })
        });
        const cfData = await cfResponse.json();
        if (!cfData.success) {
          return res.status(400).json({ error: 'Security verification failed. Please try again.' });
        }
      } catch (error) {
        console.log('Cloudflare verification failed:', error.message);
      }
    }

    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    
    if (!lastName) {
      return res.status(400).json({ error: 'Please enter both first and last name' });
    }

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
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
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
      return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
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

    // Email sending disabled temporarily - hMailPlus suspended
    let emailResult = { success: false, error: 'Email service temporarily unavailable' };
    
    // Skip email sending for now
    // try {
    //   emailResult = await emailVerification.sendRegistrationVerification(email, fullName, verificationToken);
    // } catch (error) {
    //   console.log('Email sending failed, continuing registration:', error.message);
    // }

    // Create JWT token with verified status (email service down)
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: true },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    const message = emailResult.success 
      ? 'Account created successfully! Please verify your email to access all features.'
      : 'Account created successfully! Email verification temporarily unavailable.';
    
    res.status(201).json({
      message,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: true // Auto-verify since email is down
      },
      emailSent: false,
      requiresVerification: false
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'This email is already registered. Please login instead.' });
    }
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
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

    // Backward compatibility: Handle users with missing columns
    const emailVerified = user.email_verified || false;
    const verificationToken = user.verification_token || null;
    
    // Auto-migrate old users on login
    if (!emailVerified && !verificationToken) {
      try {
        const newToken = emailVerification.generateVerificationToken();
        await pool.query(
          'UPDATE users SET verification_token = $1, email_verified = $2 WHERE email = $3',
          [newToken, false, user.email]
        );
        
        await emailVerification.sendRegistrationVerification(
          user.email,
          `${user.first_name} ${user.last_name}`,
          newToken
        );
      } catch (error) {
        console.log('Auto-migration failed, continuing login:', error.message);
      }
    } else if (emailVerified) {
      // Send login notification for verified users
      try {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');
        
        await emailVerification.sendLoginVerification(
          user.email,
          `${user.first_name} ${user.last_name}`,
          ipAddress,
          userAgent
        );
      } catch (error) {
        console.log('Login notification failed, continuing login:', error.message);
      }
    }

    // Create JWT token with correct verification status
    const isVerified = user.email_verified || false;
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: isVerified, emailVerified: isVerified },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Backward compatibility: Safe null checks
    const hasVerificationToken = user.verification_token || false;
    const message = isVerified 
      ? 'Login successful' 
      : 'Login successful! Please verify your email to access all features. Check your inbox.';
    
    res.json({
      message,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        emailVerified: isVerified,
        balances: {
          btc: parseFloat(user.btc_balance || 0),
          eth: parseFloat(user.eth_balance || 0),
          usdt: parseFloat(user.usdt_balance || 0),
          ngn: parseFloat(user.ngn_balance || 0),
          kes: parseFloat(user.kes_balance || 0)
        }
      },
      requiresVerification: !isVerified
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, email_verified, verification_token FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (user.email_verified) {
      return res.json({ message: 'Email already verified' });
    }
    
    // Generate new token if user doesn't have one (old users)
    let verificationToken = user.verification_token;
    if (!verificationToken) {
      verificationToken = emailVerification.generateVerificationToken();
      await pool.query(
        'UPDATE users SET verification_token = $1 WHERE email = $2',
        [verificationToken, email]
      );
    }
    
    // Send verification email
    const emailResult = await emailVerification.sendRegistrationVerification(
      user.email,
      `${user.first_name} ${user.last_name}`,
      verificationToken
    );
    
    res.json({
      message: 'Verification email sent! Please check your inbox.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
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

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const result = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    const user = result.rows[0];
    const resetToken = emailVerification.generateVerificationToken();

    // Store reset token (expires in 1 hour)
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE email = $2',
      [resetToken, email]
    );

    // Send password reset email
    const emailResult = await emailVerification.sendPasswordReset(
      user.email,
      `${user.first_name} ${user.last_name}`,
      resetToken
    );

    res.json({
      message: 'If the email exists, a password reset link has been sent.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    // Find user with valid reset token
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, email_verified FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = result.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    // If user wasn't verified, verify them now (password reset confirms email ownership)
    if (!user.email_verified) {
      await pool.query(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1',
        [user.id]
      );
    }

    res.json({
      message: 'Password reset successful! You can now login with your new password.',
      emailVerified: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;