const express = require('express');
const router = express.Router();

// Get crypto rates
router.get('/rates', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=ngn,kes');
    const data = await response.json();
    
    res.json({
      BTC: { NGN: Math.round(data.bitcoin.ngn), KES: Math.round(data.bitcoin.kes) },
      ETH: { NGN: Math.round(data.ethereum.ngn), KES: Math.round(data.ethereum.kes) },
      USDT: { NGN: Math.round(data.tether.ngn), KES: Math.round(data.tether.kes) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

module.exports = router;