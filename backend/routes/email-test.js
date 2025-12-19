const express = require('express');
const emailService = require('../services/email');
const emailVerification = require('../services/email-verification');
const router = express.Router();

// Test email configuration
router.get('/test-email', async (req, res) => {
  try {
    console.log('🔧 Environment Check:');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

    const result = await emailService.testEmail();
    res.json(result);
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