const express = require('express');
const emailVerification = require('../services/email-verification');
const router = express.Router();

// Test email sending directly
router.post('/send-verification', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and fullName required' });
    }

    // Generate test token
    const token = 'test_' + Date.now();
    
    // Send verification email
    const result = await emailVerification.sendRegistrationVerification(email, fullName, token);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Verification email sent successfully!',
        messageId: result.messageId,
        email: email
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test login notification
router.post('/send-login-notification', async (req, res) => {
  try {
    const { email, fullName } = req.body;
    
    if (!email || !fullName) {
      return res.status(400).json({ error: 'Email and fullName required' });
    }

    // Send login notification
    const result = await emailVerification.sendLoginVerification(email, fullName, '127.0.0.1', 'Test Browser');
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Login notification sent successfully!',
        messageId: result.messageId,
        email: email
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;