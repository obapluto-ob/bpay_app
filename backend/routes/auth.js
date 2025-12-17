const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Pool } = require('pg');
const emailVerification = require('../services/email-verification');
const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const router = express.Router();

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

    const { email, password, fullName, country, securityQuestion, securityAnswer } = req.body;
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Hash security answer
    const hashedAnswer = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase(), 12) : null;

    // Generate UUID for user ID and verification token
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const verificationToken = emailVerification.generateVerificationToken();

    // Create user with email verification
    const result = await db.query(
      'INSERT INTO users (id, email, password, first_name, last_name, country, security_question, security_answer, email_verified, verification_token) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, first_name, last_name',
      [userId, email, hashedPassword, firstName, lastName, country || 'NG', securityQuestion, hashedAnswer, false, verificationToken]
    );

    const user = result.rows[0];

    // Send verification email
    const emailResult = await emailVerification.sendRegistrationVerification(
      email, 
      fullName, 
      verificationToken
    );

    if (emailResult.success) {
      console.log('✅ Verification email sent:', emailResult.messageId);
    } else {
      console.error('❌ Failed to send verification email:', emailResult.error);
    }

    // Create JWT token (user can login but features limited until verified)
    const token = jwt.sign(
      { id: user.id, email: user.email, verified: false },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully. Please check your email to verify your account.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: `${user.first_name} ${user.last_name}`,
        emailVerified: false
      },
      emailSent: emailResult.success
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
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Send login notification email
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const emailResult = await emailVerification.sendLoginVerification(
      user.email,
      `${user.first_name} ${user.last_name}`,
      ipAddress,
      userAgent
    );

    if (emailResult.success) {
      console.log('✅ Login notification sent:', emailResult.messageId);
    } else {
      console.error('❌ Failed to send login notification:', emailResult.error);
    }

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
        emailVerified: user.email_verified || false
      },
      loginNotificationSent: emailResult.success
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - Get Security Question
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await db.query('SELECT security_question FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    if (!user.security_question) {
      return res.status(400).json({ error: 'No security question set for this account' });
    }
    
    res.json({ securityQuestion: user.security_question });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('securityAnswer').trim().isLength({ min: 1 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;
    
    const result = await db.query('SELECT security_answer FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const isAnswerCorrect = await bcrypt.compare(securityAnswer.toLowerCase(), user.security_answer);
    
    if (!isAnswerCorrect) {
      return res.status(400).json({ error: 'Incorrect security answer' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email address
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }
    
    const result = await db.query(
      'SELECT id, email, first_name, last_name FROM users WHERE verification_token = $1',
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    // Update user as verified
    await db.query(
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

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await db.query(
      'SELECT id, email, first_name, last_name, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Generate new verification token
    const newToken = emailVerification.generateVerificationToken();
    await db.query(
      'UPDATE users SET verification_token = $1 WHERE email = $2',
      [newToken, email]
    );
    
    // Send new verification email
    const emailResult = await emailVerification.sendRegistrationVerification(
      email,
      `${user.first_name} ${user.last_name}`,
      newToken
    );
    
    if (emailResult.success) {
      res.json({ message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all users (for testing - remove in production)
router.get('/admin/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, first_name, last_name, country, email_verified, created_at FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;