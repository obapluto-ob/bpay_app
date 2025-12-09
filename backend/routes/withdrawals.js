const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Create withdrawal request
router.post('/create', async (req, res) => {
  try {
    const { userId, amount, currency, walletAddress, bankDetails } = req.body;
    const id = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check balance
    const user = await pool.query(`SELECT ${currency.toLowerCase()}_balance FROM users WHERE id = $1`, [userId]);
    const balance = parseFloat(user.rows[0][`${currency.toLowerCase()}_balance`] || 0);
    
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Lock funds
    await pool.query(
      `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance - $1 WHERE id = $2`,
      [amount, userId]
    );
    
    await pool.query(
      'INSERT INTO withdrawals (id, user_id, amount, currency, wallet_address, bank_details) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, userId, amount, currency, walletAddress, JSON.stringify(bankDetails)]
    );
    
    res.json({ success: true, withdrawalId: id, message: 'Withdrawal request submitted. Admin will process within 24 hours.' });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// Get user withdrawals
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json({ withdrawals: result.rows });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Admin: Get all pending withdrawals
router.get('/admin/pending', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, u.first_name, u.last_name, u.email 
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      WHERE w.status = 'pending' 
      ORDER BY w.created_at ASC
    `);
    res.json({ withdrawals: result.rows });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Admin: Approve withdrawal
router.post('/admin/:withdrawalId/approve', async (req, res) => {
  try {
    const { adminId, notes } = req.body;
    
    await pool.query(
      'UPDATE withdrawals SET status = $1, admin_notes = $2, processed_by = $3, processed_at = NOW() WHERE id = $4',
      ['completed', notes, adminId, req.params.withdrawalId]
    );
    
    res.json({ success: true, message: 'Withdrawal approved' });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// Admin: Reject withdrawal (refund user)
router.post('/admin/:withdrawalId/reject', async (req, res) => {
  try {
    const { adminId, reason } = req.body;
    
    const withdrawal = await pool.query('SELECT * FROM withdrawals WHERE id = $1', [req.params.withdrawalId]);
    const { user_id, amount, currency } = withdrawal.rows[0];
    
    // Refund user
    await pool.query(
      `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance + $1 WHERE id = $2`,
      [amount, user_id]
    );
    
    await pool.query(
      'UPDATE withdrawals SET status = $1, admin_notes = $2, processed_by = $3, processed_at = NOW() WHERE id = $4',
      ['rejected', reason, adminId, req.params.withdrawalId]
    );
    
    res.json({ success: true, message: 'Withdrawal rejected and funds refunded' });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

module.exports = router;
