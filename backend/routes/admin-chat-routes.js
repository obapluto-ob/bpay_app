const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Get pending trades
router.get('/trades/pending', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT t.*, u.email as user_email FROM trades t LEFT JOIN users u ON t.user_id = u.id WHERE t.status IN ('pending', 'verifying') ORDER BY t.created_at DESC"
    );
    res.json({ trades: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get trade chat messages
router.get('/trades/:tradeId/chat', authenticateAdmin, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE trade_id = $1 ORDER BY created_at ASC',
      [tradeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send chat message
router.post('/trades/:tradeId/chat', authenticateAdmin, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { message, type } = req.body;
    const adminId = req.admin.id;
    
    const result = await pool.query(
      'INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tradeId, adminId, 'admin', message, type || 'text']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Approve trade
router.post('/trades/:tradeId/approve', authenticateAdmin, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const adminId = req.admin.id;
    
    // Get trade details
    const tradeResult = await pool.query('SELECT * FROM trades WHERE id = $1', [tradeId]);
    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const trade = tradeResult.rows[0];
    
    // Update trade status
    await pool.query(
      'UPDATE trades SET status = $1, admin_id = $2 WHERE id = $3',
      ['completed', adminId, tradeId]
    );
    
    // Credit user balance if buy order
    if (trade.type === 'buy') {
      const crypto = trade.crypto;
      const amount = parseFloat(trade.crypto_amount);
      
      // Update user crypto balance
      await pool.query(
        `UPDATE users SET ${crypto.toLowerCase()}_balance = COALESCE(${crypto.toLowerCase()}_balance, 0) + $1 WHERE id = $2`,
        [amount, trade.user_id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Reject trade
router.post('/trades/:tradeId/reject', authenticateAdmin, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { reason } = req.body;
    const adminId = req.admin.id;
    
    const result = await pool.query(
      'UPDATE trades SET status = $1, admin_id = $2, admin_notes = $3 WHERE id = $4 RETURNING *',
      ['rejected', adminId, reason, tradeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    res.json({ success: true, trade: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

// Admin-to-admin chat
router.get('/chat/:receiverId', authenticateAdmin, async (req, res) => {
  try {
    const { receiverId } = req.params;
    const senderId = req.admin.id;
    
    const result = await pool.query(
      'SELECT * FROM admin_chat_messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at ASC',
      [senderId, receiverId]
    );
    
    res.json({ messages: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/chat/send', authenticateAdmin, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.admin.id;
    
    const result = await pool.query(
      'INSERT INTO admin_chat_messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
      [senderId, receiverId, message]
    );
    
    res.json({ message: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
