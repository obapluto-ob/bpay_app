const express = require('express');
const router = express.Router();

// Get real-time crypto rates from CoinGecko (free API)
router.get('/live-rates', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // CoinGecko free API - no key needed
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd,ngn&include_24hr_change=true'
    );
    
    const data = await response.json();
    
    // Get KES rate (USD to KES is approximately 130)
    const usdToKes = 130;
    
    const rates = {
      BTC: {
        usd: data.bitcoin.usd,
        ngn: data.bitcoin.ngn,
        kes: Math.round(data.bitcoin.usd * usdToKes),
        change24h: data.bitcoin.usd_24h_change
      },
      ETH: {
        usd: data.ethereum.usd,
        ngn: data.ethereum.ngn,
        kes: Math.round(data.ethereum.usd * usdToKes),
        change24h: data.ethereum.usd_24h_change
      },
      USDT: {
        usd: data.tether.usd,
        ngn: data.tether.ngn,
        kes: Math.round(data.tether.usd * usdToKes),
        change24h: data.tether.usd_24h_change
      }
    };

    res.json({
      success: true,
      rates,
      timestamp: new Date().toISOString(),
      source: 'CoinGecko'
    });
  } catch (error) {
    console.error('Live rates error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch live rates',
      rates: {
        BTC: { usd: 95000, ngn: 150000000, kes: 12350000, change24h: 0 },
        ETH: { usd: 3500, ngn: 5530000, kes: 455000, change24h: 0 },
        USDT: { usd: 1, ngn: 1580, kes: 130, change24h: 0 }
      }
    });
  }
});

module.exports = router;