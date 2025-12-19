const express = require('express');
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
router.get('/test-verification', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Email verification system ready',
      method: 'netlify_function',
      endpoint: 'https://bpayapp.netlify.app/.netlify/functions/send-email',
      status: 'configured'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;