const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const lunoService = require('../services/luno');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// POST /api/withdrawals/crypto — send crypto to external address
router.post('/crypto', auth, async (req, res) => {
  const { amount, address, asset = 'XBT' } = req.body;
  const userId = req.user.id;
  const lunoAsset = asset.toUpperCase();

  if (!amount || !address) return res.status(400).json({ error: 'Amount and address required' });
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const col = lunoService.getBalanceCol(lunoAsset);
  if (!col) return res.status(400).json({ error: `Unsupported asset: ${lunoAsset}` });

  try {
    const user = await query(`SELECT ${col} FROM users WHERE id = ?`, [userId]);
    if (!user.rows[0]) return res.status(404).json({ error: 'User not found' });
    const balance = parseFloat(user.rows[0][col] || 0);
    if (balance < amountNum) return res.status(400).json({ error: `Insufficient balance. Available: ${balance} ${lunoAsset}` });

    await query(`UPDATE users SET ${col} = ${col} - ? WHERE id = ?`, [amountNum, userId]);

    const result = await lunoService.sendCrypto({ asset: lunoAsset, amount: amountNum, address, reference: `BPay withdrawal ${userId}` });

    if (result.success) {
      const wdId = `WD_${Date.now()}_${userId.toString().slice(-6)}`;
      await query(
        'INSERT INTO withdrawals (id, user_id, amount, currency, wallet_address, status) VALUES (?, ?, ?, ?, ?, ?)',
        [wdId, userId, amountNum, lunoAsset, address, 'processing']
      );
      return res.json({ success: true, withdrawalId: wdId, message: 'Withdrawal sent successfully' });
    }

    await query(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`, [amountNum, userId]);
    res.status(400).json({ error: result.error || 'Withdrawal failed. Funds returned to your balance.' });
  } catch (error) {
    console.error('Crypto withdrawal error:', error);
    try { await query(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`, [amountNum, userId]); } catch (_) {}
    res.status(500).json({ error: 'Withdrawal failed. Funds returned to your balance.' });
  }
});

// GET /api/withdrawals/history — user withdrawal history
router.get('/history', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, amount, currency, wallet_address, status, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ withdrawals: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Admin: get pending withdrawals
router.get('/admin/pending', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT w.*, u.first_name, u.last_name, u.email
      FROM withdrawals w JOIN users u ON w.user_id = u.id
      WHERE w.status = 'pending' ORDER BY w.created_at ASC
    `);
    res.json({ withdrawals: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// Admin: reject withdrawal and refund
router.post('/admin/:id/reject', auth, async (req, res) => {
  try {
    const wd = await query('SELECT * FROM withdrawals WHERE id = ?', [req.params.id]);
    if (!wd.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { user_id, amount, currency } = wd.rows[0];
    const col = currency === 'BTC' ? 'btc_balance' : `${currency.toLowerCase()}_balance`;
    await query(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`, [amount, user_id]);
    await query("UPDATE withdrawals SET status = 'rejected', admin_notes = ?, processed_at = datetime('now') WHERE id = ?", [req.body.reason || '', req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject' });
  }
});

module.exports = router;
