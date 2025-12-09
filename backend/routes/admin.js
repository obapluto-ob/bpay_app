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
    
    // Check if deposits table exists
    console.log('Fetching deposits...');
    let deposits = { rows: [{ count: 0 }] };
    try {
      deposits = await pool.query('SELECT COUNT(*) FROM deposits WHERE status = $1', ['pending']);
      console.log('✅ Deposits:', deposits.rows[0].count);
    } catch (e) {
      console.log('⚠️ Deposits table not found:', e.message);
    }
    
    // Get NGN volume
    console.log('Fetching NGN volume...');
    const ngnVolume = await pool.query(
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE DATE(created_at) = CURRENT_DATE AND country = 'NG' AND status IN ('completed', 'pending')"
    ).catch((e) => {
      console.error('❌ NGN volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ NGN volume:', ngnVolume.rows[0].sum);
    
    // Get KES volume
    console.log('Fetching KES volume...');
    const kesVolume = await pool.query(
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE DATE(created_at) = CURRENT_DATE AND country = 'KE' AND status IN ('completed', 'pending')"
    ).catch((e) => {
      console.error('❌ KES volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ KES volume:', kesVolume.rows[0].sum);
    
    // Get recent orders
    console.log('Fetching recent orders...');
    let recentOrders = { rows: [] };
    try {
      recentOrders = await pool.query(`
        SELECT t.*, 
               COALESCE(t.order_id, LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 9, '0')) as order_id,
               COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') as user_name, 
               COALESCE(u.email, 'no-email@bpay.com') as user_email
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
    // Return empty stats instead of error
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

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, first_name, last_name, country, kyc_status, created_at, btc_balance, eth_balance, usdt_balance, ngn_balance, kes_balance FROM users ORDER BY created_at DESC');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all trades
router.get('/trades', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.first_name, u.last_name, u.email 
      FROM trades t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `);
    res.json({ trades: result.rows });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get all deposits
router.get('/deposits', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.first_name, u.last_name, u.email 
      FROM deposits d 
      JOIN users u ON d.user_id = u.id 
      ORDER BY d.created_at DESC
    `);
    res.json({ deposits: result.rows });
  } catch (error) {
    console.error('Deposits error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Get deposit methods
router.get('/deposit-methods', (req, res) => {
  res.json({
    kenya: {
      mpesa: {
        paybill: '756756',
        account: '53897',
        name: 'BPay Kenya'
      }
    },
    nigeria: {
      bank: {
        bankName: 'GLOBUS BANK',
        accountName: 'GLOBAL BURGERS NIGERIA LIMITED',
        accountNumber: '1000461745'
      }
    },
    crypto: {
      btc: {
        address: '1H47BfoW6VFyYwFz18BxNZDeBzfEZYjyMQ',
        network: 'BTC'
      },
      eth: {
        address: '0x0a84b4f12e332324bf5256aaeb57b6751fa8c1fa',
        network: 'Ethereum (ERC20)'
      },
      usdt: {
        address: 'TAMS1NHkMepW46fCFnoyCvvN9Yb9jATXNB',
        network: 'Tron (TRC20)'
      }
    }
  });
});

// Approve deposit
router.post('/deposits/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const deposit = await pool.query('SELECT * FROM deposits WHERE id = $1', [id]);
    
    if (deposit.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found' });
    }
    
    const dep = deposit.rows[0];
    await pool.query('UPDATE deposits SET status = $1 WHERE id = $2', ['completed', id]);
    await pool.query(`UPDATE users SET ${dep.currency.toLowerCase()}_balance = ${dep.currency.toLowerCase()}_balance + $1 WHERE id = $2`, [dep.amount, dep.user_id]);
    
    res.json({ message: 'Deposit approved' });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

// Approve trade
router.post('/trades/:id/approve', async (req, res) => {
  try {
    const tradeId = req.params.id;
    const trade = await pool.query('SELECT * FROM trades WHERE id = $1', [tradeId]);
    
    if (trade.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    
    const t = trade.rows[0];
    
    // Update user balance
    if (t.type === 'buy') {
      await pool.query(
        `UPDATE users SET ${t.crypto.toLowerCase()}_balance = ${t.crypto.toLowerCase()}_balance + $1 WHERE id = $2`,
        [t.crypto_amount, t.user_id]
      );
    } else if (t.type === 'sell') {
      await pool.query(
        `UPDATE users SET ${t.country === 'NG' ? 'ngn_balance' : 'kes_balance'} = ${t.country === 'NG' ? 'ngn_balance' : 'kes_balance'} + $1 WHERE id = $2`,
        [t.fiat_amount, t.user_id]
      );
    }
    
    await pool.query('UPDATE trades SET status = $1, updated_at = NOW() WHERE id = $2', ['completed', tradeId]);
    
    // Send system message
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [`msg_${Date.now()}`, tradeId, 'system', 'system', 'Trade approved and completed successfully!', ]
    );
    
    res.json({ message: 'Trade approved' });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Reject trade
router.post('/trades/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const tradeId = req.params.id;
    
    await pool.query('UPDATE trades SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', tradeId]);
    
    // Send system message
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [`msg_${Date.now()}`, tradeId, 'system', 'system', `Trade rejected. Reason: ${reason || 'Invalid payment proof'}`]
    );
    
    res.json({ message: 'Trade rejected' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

// Admin send chat message
router.post('/trades/:id/chat', async (req, res) => {
  try {
    const { message, adminId } = req.body;
    const tradeId = req.params.id;
    
    const msgId = 'msg_' + Date.now();
    await pool.query(
      'INSERT INTO chat_messages (id, trade_id, sender_id, sender_type, message, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [msgId, tradeId, adminId, 'admin', message]
    );
    
    res.json({ success: true, messageId: msgId });
  } catch (error) {
    console.error('Admin chat error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get admin list
router.get('/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, COALESCE(is_online, false) as is_online, COALESCE(average_rating, 0) as average_rating, COALESCE(total_trades, 0) as total_trades, COALESCE(response_time, 0) as response_time FROM admins ORDER BY name');
    res.json({ admins: result.rows || [] });
  } catch (error) {
    console.error('Admin list error:', error);
    res.json({ admins: [] });
  }
});

// Get admin profile
router.get('/profile', async (req, res) => {
  try {
    const adminId = req.user?.id || 'admin_1';
    const result = await pool.query('SELECT id, name, email, role FROM admins WHERE id = $1', [adminId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get admin-to-admin chat messages
router.get('/chat/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    const currentAdminId = req.user?.id || 'admin_1';
    
    const result = await pool.query(
      'SELECT * FROM admin_chat_messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1) ORDER BY created_at ASC',
      [currentAdminId, adminId]
    );
    
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Admin chat error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send admin-to-admin message
router.post('/chat/send', async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user?.id || 'admin_1';
    
    const msgId = 'admin_msg_' + Date.now();
    await pool.query(
      'INSERT INTO admin_chat_messages (id, sender_id, receiver_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [msgId, senderId, receiverId, message]
    );
    
    res.json({ success: true, message: { id: msgId, senderId, receiverId, message, timestamp: new Date() } });
  } catch (error) {
    console.error('Send admin message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get admin performance metrics
router.get('/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        a.name, 
        COALESCE(a.average_rating, 0) as average_rating, 
        COALESCE(a.total_trades, 0) as total_trades, 
        COALESCE(a.response_time, 0) as response_time,
        COUNT(t.id) as pending_trades
      FROM admins a
      LEFT JOIN trades t ON t.assigned_admin = a.id AND t.status = 'pending'
      GROUP BY a.id, a.name, a.average_rating, a.total_trades, a.response_time
      ORDER BY a.average_rating DESC
    `);
    
    res.json({ admins: result.rows || [] });
  } catch (error) {
    console.error('Performance error:', error);
    res.json({ admins: [] });
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

// Resolve dispute
router.post('/disputes/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { response, resolution } = req.body;
    const adminId = req.user?.id || 'admin_1';
    
    await pool.query(
      'UPDATE disputes SET status = $1, admin_response = $2, resolved_by = $3, resolved_at = NOW() WHERE id = $4',
      ['resolved', response, adminId, id]
    );
    
    // Update trade status
    const dispute = await pool.query('SELECT trade_id FROM disputes WHERE id = $1', [id]);
    if (dispute.rows.length > 0) {
      await pool.query(
        'UPDATE trades SET status = $1 WHERE id = $2',
        [resolution === 'approve' ? 'completed' : 'rejected', dispute.rows[0].trade_id]
      );
    }
    
    res.json({ success: true, message: 'Dispute resolved' });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

module.exports = router;