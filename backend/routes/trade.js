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

// Create trade with auto admin assignment
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { type, crypto, fiatAmount, cryptoAmount, paymentMethod, country, bankDetails } = req.body;
    const userId = req.user.id;
    
    // Validate required fields
    if (!type || !crypto || (!fiatAmount && fiatAmount !== 0) || (!cryptoAmount && cryptoAmount !== 0)) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        received: { type, crypto, fiatAmount, cryptoAmount },
        required: ['type', 'crypto', 'fiatAmount', 'cryptoAmount']
      });
    }
    
    // Auto-assign best available admin
    const adminQuery = `
      SELECT id, name, average_rating, response_time, total_trades 
      FROM admins 
      WHERE is_online = true 
      AND (assigned_region = $1 OR assigned_region = 'ALL')
      ORDER BY average_rating DESC, response_time ASC, total_trades ASC
      LIMIT 1
    `;
    const adminResult = await pool.query(adminQuery, [country || 'NG']);
    const assignedAdmin = adminResult.rows[0];
    
    // Create trade record
    const tradeId = 'trade_' + Date.now();
    const query = `
      INSERT INTO trades (id, user_id, type, crypto, fiat_amount, crypto_amount, payment_method, country, status, assigned_admin, bank_details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      assignedAdmin?.id || null,
      bankDetails ? JSON.stringify(bankDetails) : null,
      new Date().toISOString()
    ];
    
    const result = await pool.query(query, values);
    const trade = result.rows[0];
    
    // Create initial chat message to admin
    const msgId = 'msg_' + Date.now();
    const initialMessage = type === 'buy' 
      ? `🔔 New BUY order: User wants to buy ${cryptoAmount} ${crypto} for ${fiatAmount} ${country === 'NG' ? 'NGN' : 'KES'}. Payment method: ${paymentMethod}. Please verify payment and release crypto.`
      : `🔔 New SELL order: User wants to sell ${cryptoAmount} ${crypto} for ${fiatAmount} ${country === 'NG' ? 'NGN' : 'KES'}. Bank: ${bankDetails?.bankName || 'N/A'}. Please verify and process payment.`;
    
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, 'system', 'system', initialMessage]
    );
    
    // Send welcome message to user
    const welcomeMsgId = 'msg_' + (Date.now() + 1);
    const welcomeMessage = assignedAdmin 
      ? `✅ Order created! You've been matched with ${assignedAdmin.name} (⭐ ${assignedAdmin.average_rating || 5.0}/5.0). They will assist you with this ${type} order.`
      : `✅ Order created! An admin will be assigned shortly to assist you.`;
    
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [welcomeMsgId, tradeId, 'system', 'system', welcomeMessage]
    );
    
    res.json({ 
      success: true,
      trade: {
        id: trade.id,
        type: trade.type,
        crypto: trade.crypto,
        fiatAmount: trade.fiat_amount,
        cryptoAmount: trade.crypto_amount,
        status: trade.status,
        assignedAdmin: assignedAdmin ? {
          id: assignedAdmin.id,
          name: assignedAdmin.name,
          rating: assignedAdmin.average_rating
        } : null,
        createdAt: trade.created_at
      }
    });
  } catch (error) {
    console.error('Trade creation error:', error);
    res.status(500).json({ error: 'Failed to create trade', details: error.message });
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
    
    const messages = result.rows.map(msg => ({
      id: msg.id,
      sender: msg.sender_type,
      message: msg.message,
      timestamp: msg.created_at
    }));
    
    res.json({ messages });
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

// Rate trade
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    await pool.query(
      'UPDATE trades SET rating = $1, rating_comment = $2, rated = true WHERE id = $3 AND user_id = $4',
      [rating, comment, tradeId, userId]
    );
    
    res.json({ success: true, message: 'Rating submitted' });
  } catch (error) {
    console.error('Rate trade error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Complete order
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    const trade = await pool.query('SELECT * FROM trades WHERE id = $1 AND user_id = $2', [tradeId, userId]);
    
    if (trade.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    if (trade.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending trades can be completed' });
    }
    
    await pool.query('UPDATE trades SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', tradeId]);
    
    // Add completion message
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, 'system', 'system', '✅ Order completed successfully!']
    );
    
    res.json({ success: true, message: 'Order completed' });
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

// Raise dispute
router.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { reason, evidence } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    if (!reason || !evidence) {
      return res.status(400).json({ error: 'Reason and evidence required' });
    }
    
    const disputeId = 'dispute_' + Date.now();
    await pool.query(
      'INSERT INTO disputes (id, trade_id, user_id, reason, evidence, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [disputeId, tradeId, userId, reason, evidence, 'open']
    );
    
    await pool.query(
      'UPDATE trades SET status = $1 WHERE id = $2',
      ['disputed', tradeId]
    );
    
    // Add system message
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, 'system', 'system', `⚠️ Dispute raised: ${reason}`]
    );
    
    res.json({ success: true, disputeId });
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

module.exports = router;