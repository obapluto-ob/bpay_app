const express = require('express');
const emailFallback = require('../services/email-fallback');
const router = express.Router();

// Auto-send SasaPay request with merchant code 53897
router.post('/sasapay-request', async (req, res) => {
  try {
    console.log('🚀 Auto-sending SasaPay API request for merchant code 53897...');
    
    const result = await emailFallback.sendSasaPayRequest();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'SasaPay API request prepared successfully',
        merchantCode: '53897',
        instructions: 'Copy the email template below and send to developers@sasapay.app',
        emailTemplate: emailFallback.getEmailTemplate()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        merchantCode: '53897'
      });
    }
  } catch (error) {
    console.error('Auto-email error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      merchantCode: '53897'
    });
  }
});

// Get formatted email template for manual sending
router.get('/sasapay-template', (req, res) => {
  try {
    const template = emailFallback.getEmailTemplate();
    
    res.json({
      success: true,
      merchantCode: '53897',
      template: template,
      instructions: [
        '1. Copy the email body below',
        '2. Open your Gmail or any email client',
        '3. Send to: developers@sasapay.app',
        '4. Subject: API Credentials Request for Merchant Code 53897',
        '5. Paste the body and send'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;