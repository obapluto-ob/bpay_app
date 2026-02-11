const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Create withdrawal request
router.post('/create', authenticateToken, async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        bank_details TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const { amount, currency, bankDetails } = req.body;
    const userId = req.user.id;
    const withdrawalId = 'wd_' + Math.random().toString(36).substr(2, 8).toUpperCase();

    // Check balance
    const userBalance = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const balance = userBalance.rows[0]?.[currency.toLowerCase() + '_balance'] || 0;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal
    await pool.query(
      'INSERT INTO withdrawals (id, user_id, amount, currency, bank_details, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [withdrawalId, userId, amount, currency, JSON.stringify(bankDetails), 'pending']
    );

    // Deduct from balance
    await pool.query(
      `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance - $1 WHERE id = $2`,
      [amount, userId]
    );

    res.json({ success: true, withdrawalId });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
});

// Get user withdrawals
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ withdrawals: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

module.exports = router;
