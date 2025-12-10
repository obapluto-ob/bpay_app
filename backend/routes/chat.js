const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');
const websocketService = require('../src/services/websocket');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Get chat messages for a trade
router.get('/trade/:tradeId/messages', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM chat_messages 
      WHERE trade_id = $1 
      ORDER BY created_at ASC
    `, [tradeId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send chat message (REST fallback)
router.post('/trade/:tradeId/message', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { message, type = 'text' } = req.body;
    const userId = req.user.id;

    const result = await pool.query(`
      INSERT INTO chat_messages (trade_id, sender_id, sender_type, message, message_type)
      VALUES ($1, $2, 'user', $3, $4)
      RETURNING *
    `, [tradeId, userId, message, type]);

    const chatMessage = result.rows[0];

    // Broadcast via WebSocket
    websocketService.broadcastToTradeChat(tradeId, {
      type: 'new_chat_message',
      message: {
        id: chatMessage.id,
        tradeId: chatMessage.trade_id,
        senderId: chatMessage.sender_id,
        senderType: chatMessage.sender_type,
        message: chatMessage.message,
        timestamp: chatMessage.created_at,
        type: chatMessage.message_type
      }
    });

    res.json(chatMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get admin chat messages
router.get('/admin/messages', auth, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const result = await pool.query(`
      SELECT * FROM admin_chat_messages 
      WHERE sender_id = $1 OR receiver_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [adminId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin messages:', error);
    res.status(500).json({ error: 'Failed to fetch admin messages' });
  }
});

// Send admin chat message
router.post('/admin/message', auth, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    const result = await pool.query(`
      INSERT INTO admin_chat_messages (sender_id, receiver_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [senderId, receiverId, message]);

    const chatMessage = result.rows[0];

    // Send via WebSocket
    websocketService.sendToAdmin(receiverId, {
      type: 'new_admin_message',
      message: {
        id: chatMessage.id,
        senderId: chatMessage.sender_id,
        receiverId: chatMessage.receiver_id,
        message: chatMessage.message,
        timestamp: chatMessage.created_at
      }
    });

    res.json(chatMessage);
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({ error: 'Failed to send admin message' });
  }
});

module.exports = router;