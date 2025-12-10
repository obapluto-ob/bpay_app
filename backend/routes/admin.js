const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get system stats
router.get('/stats', async (req, res) => {
  console.log('📊 Stats endpoint called');
  try {
    console.log('Fetching users count...');
    const users = await pool.query('SELECT COUNT(*) FROM users').catch((e) => {
      console.error('❌ Users query failed:', e.message);
      return { rows: [{ count: 0 }] };
    });
    console.log('✅ Users:', users.rows[0].count);
    
    console.log('Fetching pending trades...');
    const pendingTrades = await pool.query('SELECT COUNT(*) FROM trades WHERE status = $1', ['pending']).catch((e) => {
      console.error('❌ Trades query failed:', e.message);
      return { rows: [{ count: 0 }] };
    });
    console.log('✅ Pending trades:', pendingTrades.rows[0].count);
    
    console.log('Fetching deposits...');
    let deposits = { rows: [{ count: 0 }] };
    try {
      deposits = await pool.query('SELECT COUNT(*) FROM deposits WHERE status = $1', ['pending']);
      console.log('✅ Deposits:', deposits.rows[0].count);
    } catch (e) {
      console.log('⚠️ Deposits table not found:', e.message);
    }
    
    console.log('Fetching NGN volume...');
    const ngnVolume = await pool.query(
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE country = 'NG' AND status = 'completed'"
    ).catch((e) => {
      console.error('❌ NGN volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ NGN volume:', ngnVolume.rows[0].sum);
    
    console.log('Fetching KES volume...');
    const kesVolume = await pool.query(
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE country = 'KE' AND status = 'completed'"
    ).catch((e) => {
      console.error('❌ KES volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ KES volume:', kesVolume.rows[0].sum);
    
    console.log('Fetching recent orders...');
    let recentOrders = { rows: [] };
    try {
      recentOrders = await pool.query(`
        SELECT t.id, t.type, t.crypto, t.fiat_amount, t.status, t.created_at, t.country,
               u.first_name, u.last_name, u.email
        FROM trades t
        LEFT JOIN users u ON t.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 10
      `);
      console.log('✅ Recent orders:', recentOrders.rows.length);
    } catch (e) {
      console.error('❌ Recent orders query failed:', e.message);
    }
    
    const response = {
      totalUsers: parseInt(users.rows[0].count || 0),
      ngnVolume: parseFloat(ngnVolume.rows[0].sum || 0),
      kesVolume: parseFloat(kesVolume.rows[0].sum || 0),
      pendingTrades: parseInt(pendingTrades.rows[0].count || 0),
      pendingDeposits: parseInt(deposits.rows[0].count || 0),
      recentOrders: recentOrders.rows || []
    };
    console.log('✅ Stats response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ STATS ERROR:', error.message);
    console.error('Stack:', error.stack);
    const emptyResponse = {
      totalUsers: 0,
      ngnVolume: 0,
      kesVolume: 0,
      pendingTrades: 0,
      pendingDeposits: 0,
      recentOrders: []
    };
    console.log('⚠️ Returning empty stats due to error');
    res.json(emptyResponse);
  }
});

// KYC approval
router.post('/kyc/:userId/approved', async (req, res) => {
  try {
    await pool.query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['approved', req.params.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// KYC rejection
router.post('/kyc/:userId/rejected', async (req, res) => {
  try {
    await pool.query('UPDATE users SET kyc_status = $1 WHERE id = $2', ['rejected', req.params.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, country, kyc_status, 
             btc_balance, eth_balance, usdt_balance, ngn_balance, kes_balance, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*, u.first_name, u.last_name, u.email 
      FROM trades t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `;
    let params = [];
    
    if (status && status !== 'all') {
      query = `
        SELECT t.*, u.first_name, u.last_name, u.email 
        FROM trades t 
        LEFT JOIN users u ON t.user_id = u.id 
        WHERE t.status = $1
        ORDER BY t.created_at DESC
      `;
      params = [status];
    }
    
    const result = await pool.query(query, params);
    const trades = result.rows.map(trade => ({
      ...trade,
      fiatAmount: trade.fiat_amount,
      cryptoAmount: trade.crypto_amount,
      createdAt: trade.created_at,
      paymentProof: trade.payment_proof,
      bankDetails: trade.bank_details
    }));
    
    res.json({ trades });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get admin performance
router.get('/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        a.name, 
        a.email,
        0 as average_rating, 
        0 as total_trades, 
        0 as response_time,
        0 as pending_trades
      FROM admins a
      ORDER BY a.created_at DESC
    `);
    
    res.json({ admins: result.rows || [] });
  } catch (error) {
    console.error('Performance error:', error);
    res.json({ admins: [] });
  }
});

// Approve trade
router.post('/trades/:tradeId/approve', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const trade = await pool.query('SELECT * FROM trades WHERE id = $1', [tradeId]);
    
    if (trade.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const { user_id, type, crypto, crypto_amount, fiat_amount, country } = trade.rows[0];
    
    if (type === 'buy') {
      // User bought crypto - credit crypto balance
      await pool.query(
        `UPDATE users SET ${crypto.toLowerCase()}_balance = ${crypto.toLowerCase()}_balance + $1 WHERE id = $2`,
        [crypto_amount, user_id]
      );
    } else {
      // User sold crypto - credit fiat balance
      const fiatColumn = country === 'NG' ? 'ngn_balance' : 'kes_balance';
      await pool.query(
        `UPDATE users SET ${fiatColumn} = ${fiatColumn} + $1 WHERE id = $2`,
        [fiat_amount, user_id]
      );
    }
    
    await pool.query('UPDATE trades SET status = $1 WHERE id = $2', ['completed', tradeId]);
    
    const message = type === 'buy' 
      ? `Trade approved! User received ${crypto_amount} ${crypto}` 
      : `Trade approved! User received ${country === 'NG' ? '₦' : 'KSh'}${fiat_amount}`;
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Approve trade error:', error);
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Reject trade
router.post('/trades/:tradeId/reject', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { reason } = req.body;
    
    await pool.query('UPDATE trades SET status = $1, admin_notes = $2 WHERE id = $3', ['rejected', reason, tradeId]);
    
    res.json({ success: true, message: 'Trade rejected' });
  } catch (error) {
    console.error('Reject trade error:', error);
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

// Get disputes
router.get('/disputes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, t.type, t.crypto, t.fiat_amount, u.email, u.first_name, u.last_name
      FROM disputes d
      JOIN trades t ON d.trade_id = t.id
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    
    res.json({ disputes: result.rows || [] });
  } catch (error) {
    console.error('Disputes error:', error);
    res.json({ disputes: [] });
  }
});

// Get admin profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    const result = await pool.query('SELECT id, username, email FROM admins WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Get all admins for chat
router.get('/list', async (req, res) => {
  try {
    // Create admins table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        is_online BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Check if there are any admins, if not create a default one
    const countResult = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(countResult.rows[0].count) === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await pool.query(
        'INSERT INTO admins (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin_1', 'Super Admin', 'admin@bpay.com', hashedPassword, 'super_admin']
      );
      
      await pool.query(
        'INSERT INTO admins (id, username, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin_2', 'Trade Admin', 'trade@bpay.com', hashedPassword, 'trade_admin']
      );
    }
    
    const result = await pool.query(`
      SELECT id, username, email, COALESCE(is_online, false) as "isOnline", role
      FROM admins 
      ORDER BY username ASC
    `);
    
    res.json({ admins: result.rows });
  } catch (error) {
    console.error('List admins error:', error);
    res.json({ admins: [] });
  }
});

// Get chat messages between admins
router.get('/chat/:adminId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const currentAdminId = decoded.id;
    const targetAdminId = req.params.adminId;
    
    // Create admin_chat table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_chat (
        id VARCHAR(255) PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        receiver_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const result = await pool.query(`
      SELECT id, sender_id as "senderId", receiver_id as "receiverId", message, read, created_at as timestamp
      FROM admin_chat 
      WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `, [currentAdminId, targetAdminId]);
    
    // Mark messages as read
    await pool.query(
      'UPDATE admin_chat SET read = true WHERE receiver_id = $1 AND sender_id = $2',
      [currentAdminId, targetAdminId]
    );
    
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send chat message to another admin
router.post('/chat/send', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const senderId = decoded.id;
    
    const { receiverId, message } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver ID and message required' });
    }
    
    const msgId = 'admin_msg_' + Date.now();
    await pool.query(
      'INSERT INTO admin_chat (id, sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [msgId, senderId, receiverId, message]
    );
    
    const newMessage = {
      id: msgId,
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Send chat error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all deposits
router.get('/deposits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.email as user_email 
      FROM deposits d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    
    res.json({ deposits: result.rows });
  } catch (error) {
    console.error('Admin deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Approve deposit
router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get deposit details
    const depositResult = await pool.query('SELECT * FROM deposits WHERE id = $1', [id]);
    if (depositResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    
    const deposit = depositResult.rows[0];
    
    // Update deposit status
    await pool.query(
      'UPDATE deposits SET status = $1 WHERE id = $2',
      ['approved', id]
    );
    
    // Credit user balance
    const column = deposit.currency === 'NGN' ? 'ngn_balance' : 'kes_balance';
    await pool.query(
      `UPDATE users SET ${column} = ${column} + $1 WHERE id = $2`,
      [deposit.amount, deposit.user_id]
    );
    
    res.json({ success: true, message: 'Deposit approved and balance credited' });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

// Reject deposit
router.post('/deposits/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await pool.query(
      'UPDATE deposits SET status = $1 WHERE id = $2',
      ['rejected', id]
    );
    
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

// Get trade chat messages (admin view)
router.get('/trades/:tradeId/chat', async (req, res) => {
  try {
    const { tradeId } = req.params;
    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE trade_id = $1 ORDER BY created_at ASC',
      [tradeId]
    );
    
    const messages = result.rows.map(msg => ({
      id: msg.id,
      sender: msg.sender_type,
      message: msg.message,
      imageData: msg.image_data,
      timestamp: msg.created_at,
      created_at: msg.created_at
    }));
    
    res.json({ messages });
  } catch (error) {
    console.error('Admin get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Send chat message (admin to user)
router.post('/trades/:tradeId/chat', async (req, res) => {
  try {
    const { message, imageData } = req.body;
    const { tradeId } = req.params;
    
    const token = req.headers.authorization?.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const adminId = decoded.id;
    
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, image_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
      [msgId, tradeId, adminId, 'admin', message, imageData || null]
    );
    
    res.json({ success: true, messageId: msgId });
  } catch (error) {
    console.error('Admin send chat error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
