const express = require('express');
const router = express.Router();

// Placeholder routes
router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

router.get('/balance', (req, res) => {
  res.json({ btc: 0, eth: 0, usdt: 0, ngn: 0 });
});

module.exports = router;