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
router.post('/test-stk', async (req, res) => {
  try {
    const { phoneNumber, amount } = req.body;
    const result = await sasaPayTest.initiateSTKPush(phoneNumber, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;