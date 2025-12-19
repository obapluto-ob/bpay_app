const express = require('express');
const { Pool } = require('pg');
const lunoService = require('../services/luno');
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

// Send Crypto
router.post('/send', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { currency, amount, address } = req.body;
    const userId = req.user.id;

    // Check user balance
    const balanceField = `${currency.toLowerCase()}_balance`;
    const userResult = await pool.query(`SELECT ${balanceField} FROM users WHERE id = $1`, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = parseFloat(userResult.rows[0][balanceField] || 0);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create transaction record
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crypto_transactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        amount DECIMAL(20,8) NOT NULL,
        address VARCHAR(255),
        transaction_hash VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const transactionId = `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO crypto_transactions (id, user_id, type, currency, amount, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [transactionId, userId, 'send', currency.toUpperCase(), amount, address, 'pending']
    );

    // Deduct from user balance
    await pool.query(
      `UPDATE users SET ${balanceField} = ${balanceField} - $1 WHERE id = $2`,
      [amount, userId]
    );

    // Send via Luno
    const result = await lunoService.sendCrypto({
      currency: currency.toUpperCase(),
      amount,
      address
    });

    if (result.success) {
      await pool.query(
        'UPDATE crypto_transactions SET transaction_hash = $1, status = $2 WHERE id = $3',
        [result.transactionHash, 'completed', transactionId]
      );

      res.json({
        success: true,
        message: 'Crypto sent successfully',
        transactionId,
        transactionHash: result.transactionHash
      });
    } else {
      // Refund balance on failure
      await pool.query(
        `UPDATE users SET ${balanceField} = ${balanceField} + $1 WHERE id = $2`,
        [amount, userId]
      );
      
      await pool.query(
        'UPDATE crypto_transactions SET status = $1 WHERE id = $2',
        ['failed', transactionId]
      );

      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Crypto send error:', error);
    res.status(500).json({ error: 'Send failed' });
  }
});

// Generate Receive Address
router.post('/receive', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { currency } = req.body;
    const userId = req.user.id;

    const result = await lunoService.generateReceiveAddress(currency.toUpperCase());

    if (result.success) {
      // Store address for user
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_addresses (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          currency VARCHAR(10) NOT NULL,
          address VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await pool.query(
        'INSERT INTO user_addresses (id, user_id, currency, address) VALUES ($1, $2, $3, $4)',
        [addressId, userId, currency.toUpperCase(), result.address]
      );

      res.json({
        success: true,
        address: result.address,
        currency: currency.toUpperCase(),
        message: 'Send crypto to this address'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Generate address error:', error);
    res.status(500).json({ error: 'Address generation failed' });
  }
});

// Convert Crypto
router.post('/convert', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount } = req.body;
    const userId = req.user.id;

    // Check user balance
    const fromBalanceField = `${fromCurrency.toLowerCase()}_balance`;
    const toBalanceField = `${toCurrency.toLowerCase()}_balance`;
    
    const userResult = await pool.query(`SELECT ${fromBalanceField}, ${toBalanceField} FROM users WHERE id = $1`, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = parseFloat(userResult.rows[0][fromBalanceField] || 0);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get conversion rate
    const rateResult = await lunoService.getConversionRate(fromCurrency.toUpperCase(), toCurrency.toUpperCase());
    
    if (!rateResult.success) {
      return res.status(400).json({ error: 'Conversion rate unavailable' });
    }

    const convertedAmount = amount * rateResult.rate;

    // Create conversion record
    const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO crypto_transactions (id, user_id, type, currency, amount, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [conversionId, userId, 'convert', `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`, amount, 'completed']
    );

    // Update balances
    await pool.query(
      `UPDATE users SET ${fromBalanceField} = ${fromBalanceField} - $1, ${toBalanceField} = ${toBalanceField} + $2 WHERE id = $3`,
      [amount, convertedAmount, userId]
    );

    res.json({
      success: true,
      message: 'Conversion completed',
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: amount,
      toAmount: convertedAmount,
      rate: rateResult.rate
    });
  } catch (error) {
    console.error('Crypto convert error:', error);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

module.exports = router;