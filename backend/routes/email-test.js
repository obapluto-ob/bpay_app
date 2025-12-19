const express = require('express');
const emailService = require('../services/email');
const emailVerification = require('../services/email-verification');
const router = express.Router();

// Test email configuration
router.get('/test-email', async (req, res) => {
  try {
    res.json({
      success: false,
      message: 'Email system configured with Netlify fallback',
      status: 'netlify_function_ready',
      environment: {
        EMAIL_HOST: process.env.EMAIL_HOST || 'not_set',
        EMAIL_PORT: process.env.EMAIL_PORT || 'not_set',
        EMAIL_USER: process.env.EMAIL_USER || 'not_set',
        EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT_SET'
      },
      note: 'Emails are handled by Netlify function to bypass SMTP restrictions'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test verification email
router.post('/test-verification', async (req, res) => {
  try {
    const { email, name } = req.body;
    const token = 'test-token-123';
    
    const result = await emailVerification.sendRegistrationVerification(email, name, token);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;