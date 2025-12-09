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
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE DATE(created_at) = CURRENT_DATE AND country = 'NG' AND status IN ('completed', 'pending')"
    ).catch((e) => {
      console.error('❌ NGN volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ NGN volume:', ngnVolume.rows[0].sum);
    
    console.log('Fetching KES volume...');
    const kesVolume = await pool.query(
      "SELECT COALESCE(SUM(fiat_amount), 0) as sum FROM trades WHERE DATE(created_at) = CURRENT_DATE AND country = 'KE' AND status IN ('completed', 'pending')"
    ).catch((e) => {
      console.error('❌ KES volume query failed:', e.message);
      return { rows: [{ sum: 0 }] };
    });
    console.log('✅ KES volume:', kesVolume.rows[0].sum);
    
    console.log('Fetching recent orders...');
    let recentOrders = { rows: [] };
    try {
      recentOrders = await pool.query(`
        SELECT t.id, t.type, t.from_currency as crypto, t.to_amount as fiat_amount, 
               t.status, t.created_at, t.payment_method as country,
               u.first_name, u.last_name, u.email, u.country
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
    const result = await pool.query('SELECT id, email, first_name, last_name, country, kyc_status, phone_number, created_at FROM users ORDER BY created_at DESC');
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

// Get admin performance
router.get('/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        username as name, 
        email,
        0 as average_rating, 
        0 as total_trades, 
        0 as response_time,
        0 as pending_trades
      FROM admins
      ORDER BY created_at DESC
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

module.exports = router;
