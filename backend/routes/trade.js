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

// Get crypto rates from custom rates table
router.get('/rates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT crypto, buy_rate, sell_rate, updated_at 
      FROM crypto_rates 
      WHERE is_active = true
      ORDER BY crypto
    `);
    
    if (result.rows.length === 0) {
      // Fallback rates if table is empty
      return res.json({
        BTC: { buy: 45250000, sell: 44750000, lastUpdated: new Date().toISOString() },
        ETH: { buy: 2850000, sell: 2820000, lastUpdated: new Date().toISOString() },
        USDT: { buy: 1580, sell: 1570, lastUpdated: new Date().toISOString() }
      });
    }
    
    const rates = {};
    result.rows.forEach(row => {
      rates[row.crypto] = {
        buy: parseFloat(row.buy_rate),
        sell: parseFloat(row.sell_rate),
        lastUpdated: row.updated_at
      };
    });
    
    res.json(rates);
  } catch (error) {
    console.error('Rates error:', error);
    // Fallback rates on error
    res.json({
      BTC: { buy: 45250000, sell: 44750000, lastUpdated: new Date().toISOString() },
      ETH: { buy: 2850000, sell: 2820000, lastUpdated: new Date().toISOString() },
      USDT: { buy: 1580, sell: 1570, lastUpdated: new Date().toISOString() }
    });
  }
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
    
    // Auto-assign best available admin (optional - skip if table doesn't have columns)
    let assignedAdmin = null;
    try {
      const adminQuery = `
        SELECT id, username as name, email
        FROM admins 
        WHERE is_online = true 
        LIMIT 1
      `;
      const adminResult = await pool.query(adminQuery);
      assignedAdmin = adminResult.rows[0];
    } catch (adminError) {
      console.log('Admin assignment skipped:', adminError.message);
    }
    
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
    
    // Create initial chat message with payment details
    const msgId = 'msg_' + Date.now();
    let initialMessage = '';
    
    if (type === 'buy') {
      if (paymentMethod === 'bank' && country === 'NG') {
        initialMessage = `🔔 NEW BUY ORDER\n\nAmount: ${fiatAmount} NGN\nCrypto: ${cryptoAmount} ${crypto}\n\n💳 PAYMENT DETAILS:\nBank: GLOBUS BANK\nAccount: 1000461745\nName: GLOBAL BURGERS NIGERIA LIMITED\n\n⚠️ Transfer ${fiatAmount} NGN to the account above, then upload payment proof here.`;
      } else if (paymentMethod === 'bank' && country === 'KE') {
        initialMessage = `🔔 NEW BUY ORDER\n\nAmount: ${fiatAmount} KES\nCrypto: ${cryptoAmount} ${crypto}\n\n📱 M-PESA DETAILS:\nPaybill: 756756\nAccount: 53897\nBusiness: BPay Kenya\n\n⚠️ Send ${fiatAmount} KES via M-Pesa, then share confirmation message here.`;
      } else {
        initialMessage = `🔔 NEW BUY ORDER\n\nAmount: ${fiatAmount} ${country === 'NG' ? 'NGN' : 'KES'}\nCrypto: ${cryptoAmount} ${crypto}\nPayment: Wallet Balance\n\n✅ Payment will be deducted from your wallet balance.`;
      }
    } else {
      initialMessage = `🔔 NEW SELL ORDER\n\nAmount: ${cryptoAmount} ${crypto}\nReceive: ${fiatAmount} ${country === 'NG' ? 'NGN' : 'KES'}\n\n💰 PAYOUT DETAILS:\nBank: ${bankDetails?.bankName || 'N/A'}\nAccount: ${bankDetails?.accountNumber || 'N/A'}\nName: ${bankDetails?.accountName || 'N/A'}\n\n⚠️ Admin will verify and send payment to your account.`;
    }
    
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, 'system', 'system', initialMessage]
    );
    
    // Send welcome message to user
    const welcomeMsgId = 'msg_' + (Date.now() + 1);
    const welcomeMessage = assignedAdmin 
      ? `✅ Order created! You've been matched with ${assignedAdmin.name}. They will assist you with this ${type} order.`
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
          name: assignedAdmin.name
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
      country: trade.country,
      paymentProof: trade.payment_proof,
      bankDetails: trade.bank_details,
      createdAt: trade.created_at,
      created_at: trade.created_at
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
      imageData: msg.image_data,
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
    const { message, imageData } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, image_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [msgId, tradeId, userId, 'user', message, imageData || null]
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

// Raise dispute with validation
router.post('/:id/dispute', authenticateToken, async (req, res) => {
  try {
    const { reason, evidence } = req.body;
    const tradeId = req.params.id;
    const userId = req.user.id;
    
    // Validate inputs
    if (!reason || !evidence) {
      return res.status(400).json({ error: 'Reason and evidence required' });
    }
    
    if (evidence.length < 20) {
      return res.status(400).json({ error: 'Evidence must be at least 20 characters' });
    }
    
    // Check if trade exists and belongs to user
    const tradeResult = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2',
      [tradeId, userId]
    );
    
    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const trade = tradeResult.rows[0];
    
    // Prevent disputes on completed/cancelled trades
    if (trade.status === 'completed') {
      return res.status(400).json({ error: 'Cannot dispute completed trades' });
    }
    
    if (trade.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot dispute cancelled trades' });
    }
    
    // Check if already disputed
    if (trade.status === 'disputed') {
      return res.status(400).json({ error: 'Trade already under dispute' });
    }
    
    // Check for abuse - limit disputes per user
    const recentDisputes = await pool.query(
      'SELECT COUNT(*) as count FROM disputes WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'7 days\'',
      [userId]
    );
    
    if (parseInt(recentDisputes.rows[0].count) >= 3) {
      return res.status(429).json({ error: 'Too many disputes. Please contact support.' });
    }
    
    // Create dispute
    const disputeId = 'dispute_' + Date.now();
    await pool.query(
      'INSERT INTO disputes (id, trade_id, user_id, reason, evidence, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [disputeId, tradeId, userId, reason, evidence, 'open']
    );
    
    // Update trade status
    await pool.query(
      'UPDATE trades SET status = $1 WHERE id = $2',
      ['disputed', tradeId]
    );
    
    // Add system message with order details
    const msgId = 'msg_' + Date.now();
    const disputeMessage = `⚠️ DISPUTE RAISED\n\nOrder ID: ${tradeId}\nReason: ${reason}\nEvidence: ${evidence}\n\nAdmin will review within 24 hours.`;
    
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, 'system', 'system', disputeMessage]
    );
    
    res.json({ success: true, disputeId, message: 'Dispute raised successfully' });
  } catch (error) {
    console.error('Dispute error:', error);
    res.status(500).json({ error: 'Failed to raise dispute' });
  }
});

module.exports = router;