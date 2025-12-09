const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const trades = await pool.query('SELECT COUNT(*), SUM(fiat_amount) FROM trades WHERE DATE(created_at) = CURRENT_DATE');
    const pendingTrades = await pool.query('SELECT COUNT(*) FROM trades WHERE status = $1', ['pending']);
    const deposits = await pool.query('SELECT COUNT(*) FROM deposits WHERE status = $1', ['pending']);
    
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      todayTrades: parseInt(trades.rows[0].count),
      todayVolume: parseFloat(trades.rows[0].sum || 0),
      pendingTrades: parseInt(pendingTrades.rows[0].count),
      pendingDeposits: parseInt(deposits.rows[0].count)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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
    await pool.query('UPDATE trades SET status = $1 WHERE id = $2', ['completed', req.params.id]);
    res.json({ message: 'Trade approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve trade' });
  }
});

// Reject trade
router.post('/trades/:id/reject', async (req, res) => {
  try {
    await pool.query('UPDATE trades SET status = $1 WHERE id = $2', ['cancelled', req.params.id]);
    res.json({ message: 'Trade rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject trade' });
  }
});

module.exports = router;