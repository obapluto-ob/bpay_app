const express = require('express');
const { Pool } = require('pg');
const requireEmailVerification = require('../middleware/requireEmailVerification');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create trade
router.post('/create', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    // Ensure trades table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(10) NOT NULL,
        crypto VARCHAR(10) NOT NULL,
        crypto_amount DECIMAL(20,8) NOT NULL,
        fiat_amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        country VARCHAR(10) NOT NULL,
        payment_method VARCHAR(50),
        bank_details TEXT,
        payment_proof TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        admin_id VARCHAR(255),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const { type, crypto, cryptoAmount, fiatAmount, currency, country, paymentMethod, bankDetails } = req.body;
    const userId = req.user.id;
    const tradeId = 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Create trade
    const result = await pool.query(
      'INSERT INTO trades (id, user_id, type, crypto, crypto_amount, fiat_amount, currency, country, payment_method, bank_details, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [tradeId, userId, type, crypto, cryptoAmount, fiatAmount, currency, country, paymentMethod, JSON.stringify(bankDetails), 'pending']
    );

    res.json({
      success: true,
      trade: result.rows[0],
      message: `${type} order created successfully`
    });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// Get user trades
router.get('/history', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({ trades: result.rows });
  } catch (error) {
    console.error('Trade history error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get current rates
router.get('/rates', async (req, res) => {
  try {
    // Mock rates - replace with real API calls
    const rates = {
      BTC: {
        buy: 45250000, // NGN
        sell: 44750000,
        usd: 95000
      },
      ETH: {
        buy: 2850000,
        sell: 2820000,
        usd: 3500
      },
      USDT: {
        buy: 1580,
        sell: 1570,
        usd: 1
      }
    };

    const exchangeRates = {
      USDNGN: 1580,
      USDKES: 130
    };

    res.json({ rates, exchangeRates });
  } catch (error) {
    console.error('Rates error:', error);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

module.exports = router;