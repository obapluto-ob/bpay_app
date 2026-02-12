const express = require('express');
const pool = require('../config/db');
const requireEmailVerification = require('../middleware/requireEmailVerification');
const router = express.Router();

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
router.post('/create', authenticateToken, async (req, res) => {
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

    const { type, crypto, cryptoAmount, fiatAmount, paymentMethod, bankDetails, country } = req.body;
    const userId = req.user.id;
    const tradeId = Math.random().toString(36).substr(2, 5).toUpperCase();
    
    const currency = country === 'NG' ? 'NGN' : 'KES';

    // Auto-complete if wallet balance payment
    if (type === 'buy' && paymentMethod && paymentMethod === 'balance') {
      // Check user balance
      const userBalance = await pool.query(
        `SELECT ${currency.toLowerCase()}_balance FROM users WHERE id = $1`,
        [userId]
      );

      const balance = parseFloat(userBalance.rows[0]?.[`${currency.toLowerCase()}_balance`] || 0);
      const requiredAmount = parseFloat(fiatAmount);

      if (balance < requiredAmount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Deduct fiat balance
      await pool.query(
        `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance - $1 WHERE id = $2`,
        [requiredAmount, userId]
      );

      // Credit crypto (with 2% platform profit already included in rate)
      await pool.query(
        `UPDATE users SET ${crypto.toLowerCase()}_balance = COALESCE(${crypto.toLowerCase()}_balance, 0) + $1 WHERE id = $2`,
        [cryptoAmount, userId]
      );

      // Create completed trade
      const result = await pool.query(
        'INSERT INTO trades (id, user_id, type, crypto, crypto_amount, fiat_amount, currency, country, payment_method, status, admin_notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
        [tradeId, userId, type, crypto, cryptoAmount, fiatAmount, currency, country, paymentMethod, 'completed', 'Auto-completed: Wallet Balance']
      );

      // Auto-create success message
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          trade_id VARCHAR(255) NOT NULL,
          sender_id VARCHAR(255) NOT NULL,
          sender_type VARCHAR(20) NOT NULL,
          message TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'text',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      const successMessage = `PAYMENT CONFIRMED\n\nYour ${crypto} has been credited to your wallet.\nTransaction completed instantly using wallet balance!`;

      await pool.query(
        'INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type) VALUES ($1, $2, $3, $4, $5)',
        [tradeId, 'system', 'system', successMessage, 'system']
      );

      return res.json({
        success: true,
        trade: result.rows[0],
        message: 'Purchase completed instantly!',
        autoCompleted: true
      });
    }

    // Regular flow for bank/mpesa payments
    const result = await pool.query(
      'INSERT INTO trades (id, user_id, type, crypto, crypto_amount, fiat_amount, currency, country, payment_method, bank_details, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [tradeId, userId, type, crypto, cryptoAmount, fiatAmount, currency, country, paymentMethod, JSON.stringify(bankDetails || {}), 'pending']
    );

    // Auto-create order details message for admin
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        trade_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const paymentMethodDisplay = paymentMethod === 'balance' 
      ? 'Wallet Balance' 
      : (country === 'NG' ? 'Bank Transfer' : 'M-Pesa');

    const orderMessage = `NEW ${type.toUpperCase()} ORDER\n\nOrder ID: #${tradeId}\nCrypto: ${crypto}\nAmount: ${cryptoAmount} ${crypto}\nFiat: ${currency} ${parseFloat(fiatAmount).toLocaleString()}\nPayment Method: ${paymentMethodDisplay}\nCountry: ${country === 'NG' ? 'Nigeria' : 'Kenya'}\n\nWaiting for admin response...`;

    await pool.query(
      'INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type) VALUES ($1, $2, $3, $4, $5)',
      [tradeId, userId, 'system', orderMessage, 'system']
    );

    res.json({
      success: true,
      trade: result.rows[0],
      message: `${type} order created successfully`,
      tradeId: tradeId
    });
  } catch (error) {
    console.error('Create trade error:', error);
    
    // Still return success if trade was created (check if error is after insert)
    if (error.message && error.message.includes('chat_messages')) {
      return res.json({
        success: true,
        message: 'Trade created successfully',
        tradeId: req.body.tradeId || 'unknown'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create trade', 
      details: error.message 
    });
  }
});

// Get user trades
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({ trades: result.rows || [], success: true });
  } catch (error) {
    console.error('Trade history error:', error);
    res.status(500).json({ trades: [], error: 'Failed to fetch trades' });
  }
});

// Get specific trade
router.get('/:tradeId', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [tradeId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json({ trade: result.rows[0] });
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Get trade chat messages
router.get('/:tradeId/chat', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    // Just verify trade exists (allow both user and admin to see messages)
    const tradeCheck = await pool.query(
      'SELECT id FROM trades WHERE id = $1',
      [tradeId]
    );
    
    if (tradeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE trade_id = $1 ORDER BY created_at ASC',
      [tradeId]
    );
    
    res.json(result.rows || []);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send chat message
router.post('/:tradeId/chat', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { message, type } = req.body;
    const userId = req.user.id;
    
    const tradeCheck = await pool.query(
      'SELECT id FROM trades WHERE id = $1 AND user_id = $2',
      [tradeId, userId]
    );
    
    if (tradeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    // Ensure chat_messages table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        trade_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const result = await pool.query(
      'INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tradeId, userId, 'user', message, type || 'text']
    );
    
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload payment proof
router.post('/:tradeId/proof', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { proof } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE trades SET payment_proof = $1, status = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [proof, 'verifying', tradeId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json({ success: true, trade: result.rows[0] });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({ error: 'Failed to upload proof' });
  }
});

// Raise dispute
router.post('/:tradeId/dispute', authenticateToken, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE trades SET status = $1, admin_notes = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      ['disputed', reason, tradeId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json({ success: true, trade: result.rows[0] });
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

// Test endpoint to verify server restart
router.get('/test-restart', (req, res) => {
  res.json({ message: 'Server restarted successfully', timestamp: new Date().toISOString() });
});

// Get current rates (public endpoint)
router.get('/rates', async (req, res) => {
  try {
    const rates = {
      BTC: { buy: 45250000, sell: 44750000, usd: 95000 },
      ETH: { buy: 2850000, sell: 2820000, usd: 3500 },
      USDT: { buy: 1580, sell: 1570, usd: 1 },
      XRP: { buy: 4000, sell: 3950, usd: 2.5 },
      SOL: { buy: 320000, sell: 316000, usd: 200 }
    };

    const exchangeRates = {
      USDNGN: 1580,
      USDKES: 130
    };

    res.json({ rates, exchangeRates, success: true });
  } catch (error) {
    console.error('Rates error:', error);
    res.status(500).json({ error: 'Failed to fetch rates', rates: {}, exchangeRates: {} });
  }
});

module.exports = router;