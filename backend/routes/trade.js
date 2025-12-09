const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

// Get crypto rates
router.get('/rates', async (req, res) => {
  // Return fallback rates directly for now
  res.json({
    BTC: { NGN: 130012175, KES: 11592860 },
    ETH: { NGN: 4407045, KES: 392965 },
    USDT: { NGN: 1450, KES: 129 }
  });
});

// Create trade
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { type, crypto, fiatAmount, cryptoAmount, paymentMethod, country } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!type || !crypto || (!fiatAmount && fiatAmount !== 0) || (!cryptoAmount && cryptoAmount !== 0)) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        received: { type, crypto, fiatAmount, cryptoAmount },
        required: ['type', 'crypto', 'fiatAmount', 'cryptoAmount']
      });
    }
    
    // Create trade record
    const tradeId = 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const query = `
      INSERT INTO trades (id, user_id, type, crypto, fiat_amount, crypto_amount, payment_method, country, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      tradeId,
      userId,
      type,
      crypto,
      fiatAmount,
      cryptoAmount,
      paymentMethod || 'bank',
      country || 'NG',
      'pending',
      new Date().toISOString()
    ];
    
    const result = await pool.query(query, values);
    const trade = result.rows[0];
    
    res.json({ 
      success: true,
      trade: {
        id: trade.id,
        type: trade.type,
        crypto: trade.crypto,
        fiatAmount: trade.fiat_amount,
        cryptoAmount: trade.crypto_amount,
        status: trade.status,
        createdAt: trade.created_at
      }
    });
  } catch (error) {
    console.error('Trade creation error:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

// Get trade history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = 'SELECT * FROM trades WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    
    const trades = result.rows.map(trade => ({
      id: trade.id,
      type: trade.type,
      crypto: trade.crypto,
      fiatAmount: trade.fiat_amount,
      cryptoAmount: trade.crypto_amount,
      status: trade.status,
      createdAt: trade.created_at
    }));
    
    res.json(trades);
  } catch (error) {
    console.error('Trade history error:', error);
    res.status(500).json({ error: 'Failed to fetch trade history' });
  }
});

// Get single trade
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    const query = 'SELECT * FROM trades WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [tradeId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const trade = result.rows[0];
    res.json({
      id: trade.id,
      type: trade.type,
      crypto: trade.crypto,
      fiatAmount: trade.fiat_amount,
      cryptoAmount: trade.crypto_amount,
      status: trade.status,
      paymentProof: trade.payment_proof,
      assignedAdmin: trade.assigned_admin,
      createdAt: trade.created_at
    });
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Upload payment proof
router.post('/:id/payment-proof', authenticateToken, async (req, res) => {
  try {
    const { paymentProof } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    await pool.query(
      'UPDATE trades SET payment_proof = $1, status = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4',
      [paymentProof, 'awaiting_verification', tradeId, userId]
    );
    
    res.json({ success: true, message: 'Payment proof uploaded' });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Cancel trade
router.post('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    const trade = await pool.query('SELECT status FROM trades WHERE id = $1 AND user_id = $2', [tradeId, userId]);
    
    if (trade.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    if (trade.rows[0].status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed trade' });
    }
    
    await pool.query('UPDATE trades SET status = $1, updated_at = NOW() WHERE id = $2', ['cancelled', tradeId]);
    
    res.json({ success: true, message: 'Trade cancelled' });
  } catch (error) {
    console.error('Cancel trade error:', error);
    res.status(500).json({ error: 'Failed to cancel trade' });
  }
});

// Get chat messages
router.get('/:id/chat', authenticateToken, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE trade_id = $1 ORDER BY created_at ASC',
      [tradeId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Send chat message
router.post('/:id/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, userId, 'user', message]
    );
    
    res.json({ success: true, messageId: msgId });
  } catch (error) {
    console.error('Send chat error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;