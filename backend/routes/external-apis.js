const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get live crypto rates from CoinGecko
router.get('/crypto-rates', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,tether',
        vs_currencies: 'usd,ngn',
        include_24hr_change: true
      }
    });

    const rates = {
      BTC: {
        usd: response.data.bitcoin.usd,
        ngn: response.data.bitcoin.ngn || response.data.bitcoin.usd * 1580,
        change24h: response.data.bitcoin.usd_24h_change
      },
      ETH: {
        usd: response.data.ethereum.usd,
        ngn: response.data.ethereum.ngn || response.data.ethereum.usd * 1580,
        change24h: response.data.ethereum.usd_24h_change
      },
      USDT: {
        usd: response.data.tether.usd,
        ngn: response.data.tether.ngn || response.data.tether.usd * 1580,
        change24h: response.data.tether.usd_24h_change
      }
    };

    res.json({ success: true, rates });
  } catch (error) {
    console.error('CoinGecko API error:', error);
    // Fallback rates
    res.json({
      success: false,
      rates: {
        BTC: { usd: 95000, ngn: 150200000, change24h: 0 },
        ETH: { usd: 3500, ngn: 5530000, change24h: 0 },
        USDT: { usd: 1, ngn: 1580, change24h: 0 }
      },
      message: 'Using fallback rates'
    });
  }
});

// Get exchange rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    res.json({
      success: true,
      rates: {
        USDNGN: response.data.rates.NGN || 1580,
        USDKES: response.data.rates.KES || 130,
        USDEUR: response.data.rates.EUR || 0.85,
        USDGBP: response.data.rates.GBP || 0.75
      }
    });
  } catch (error) {
    console.error('Exchange rate API error:', error);
    // Fallback rates
    res.json({
      success: false,
      rates: {
        USDNGN: 1580,
        USDKES: 130,
        USDEUR: 0.85,
        USDGBP: 0.75
      },
      message: 'Using fallback rates'
    });
  }
});

// Test SasaPay connection (when credentials available)
router.post('/test-sasapay', async (req, res) => {
  try {
    const { clientId, clientSecret, merchantCode } = req.body;
    
    if (!clientId || !clientSecret || !merchantCode) {
      return res.status(400).json({ 
        error: 'Missing SasaPay credentials',
        required: ['clientId', 'clientSecret', 'merchantCode']
      });
    }

    // Test authentication
    const authResponse = await axios.post('https://sandbox.sasapay.app/api/v1/auth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    });

    res.json({
      success: true,
      message: 'SasaPay credentials valid',
      merchantCode: merchantCode,
      tokenReceived: !!authResponse.data.access_token
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid SasaPay credentials',
      details: error.response?.data || error.message
    });
  }
});

// Test Luno connection (when credentials available)
router.post('/test-luno', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ 
        error: 'Missing Luno credentials',
        required: ['apiKey', 'apiSecret']
      });
    }

    // Test balance endpoint
    const response = await axios.get('https://api.luno.com/api/1/balance', {
      auth: {
        username: apiKey,
        password: apiSecret
      }
    });

    res.json({
      success: true,
      message: 'Luno credentials valid',
      balances: response.data.balance
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Invalid Luno credentials',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;