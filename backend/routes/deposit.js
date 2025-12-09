const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

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

// Create deposit
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, paymentMethod, reference, paymentProof } = req.body;
    const userId = req.user.id;
    
    const depositId = 'dep_' + Date.now();
    await pool.query(
      'INSERT INTO deposits (id, user_id, amount, currency, payment_method, reference, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
      [depositId, userId, amount, currency, paymentMethod, reference || paymentProof, 'pending']
    );
    
    res.json({ success: true, depositId, message: 'Deposit submitted for verification' });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Get user deposits
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Deposit history error:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// Admin: Get all deposits
router.get('/admin/deposits', async (req, res) => {
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

// Admin: Approve deposit
router.post('/admin/deposits/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, amount, currency } = req.body;
    
    // Update deposit status
    await pool.query(
      'UPDATE deposits SET status = $1 WHERE id = $2',
      ['approved', id]
    );
    
    // Credit user balance
    const column = currency === 'NGN' ? 'ngn_balance' : 'kes_balance';
    await pool.query(
      `UPDATE users SET ${column} = ${column} + $1 WHERE id = $2`,
      [amount, userId]
    );
    
    res.json({ success: true, message: 'Deposit approved and balance credited' });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

// Admin: Reject deposit
router.post('/admin/deposits/:id/reject', async (req, res) => {
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

module.exports = router;
