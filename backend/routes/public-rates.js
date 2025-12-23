const express = require('express');
const router = express.Router();

// Public rates endpoint - no auth required
router.get('/public-rates', (req, res) => {
  const rates = {
    BTC: { buy: 45250000, sell: 44750000, usd: 95000 },
    ETH: { buy: 2850000, sell: 2820000, usd: 3500 },
    USDT: { buy: 1580, sell: 1570, usd: 1 }
  };

  const exchangeRates = {
    USDNGN: 1580,
    USDKES: 130
  };

  res.json({ rates, exchangeRates, success: true });
});

module.exports = router;