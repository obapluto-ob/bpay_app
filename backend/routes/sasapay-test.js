const express = require('express');
const sasaPayTest = require('../services/sasapay-test');
const router = express.Router();

// Test merchant code setup
router.get('/test-merchant', async (req, res) => {
  try {
    const result = await sasaPayTest.testMerchantCode();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test STK push structure (will work once you have credentials)
router.get('/test-stk', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'SasaPay test endpoint working. Integration ready.',
      status: 'credentials_pending',
      merchantCode: '53897',
      integration: 'ready',
      note: 'Waiting for API credentials from SasaPay support to enable live payments'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;