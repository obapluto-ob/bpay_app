const express = require('express');
const emailService = require('../services/email');
const router = express.Router();

// Test email configuration
router.get('/test', async (req, res) => {
  try {
    const result = await emailService.testEmail();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send SasaPay API request automatically
router.post('/send-sasapay-request', async (req, res) => {
  try {
    const result = await emailService.sendSasaPayRequest();
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'SasaPay API request sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;