const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    next();
  } catch { res.status(403).json({ error: 'Invalid token' }); }
};

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const notifs = [];

  try {
    // Recent trades
    const trades = await pool.query(
      'SELECT id, type, status, crypto_amount, crypto_asset, created_at FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
      [userId]
    );
    for (const t of (trades.rows || [])) {
      const icon = t.status === 'completed' ? 'check_circle' : t.status === 'failed' ? 'cancel' : 'pending';
      const color = t.status === 'completed' ? 'green' : t.status === 'failed' ? 'red' : 'orange';
      notifs.push({
        id: `trade_${t.id}`,
        icon,
        color,
        title: `${t.type === 'buy' ? 'Buy' : 'Sell'} order ${t.status}`,
        subtitle: `${parseFloat(t.crypto_amount || 0).toFixed(6)} ${t.crypto_asset || ''}`,
        time: t.created_at,
      });
    }

    // Recent deposits (luno credits)
    const deposits = await pool.query(
      'SELECT id, asset, amount, status, created_at FROM deposits WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
      [userId]
    );
    for (const d of (deposits.rows || [])) {
      notifs.push({
        id: `dep_${d.id}`,
        icon: 'arrow_downward',
        color: 'blue',
        title: `Deposit ${d.status}`,
        subtitle: `${parseFloat(d.amount || 0).toFixed(6)} ${d.asset || ''}`,
        time: d.created_at,
      });
    }

    // Recent withdrawals
    const withdrawals = await pool.query(
      'SELECT id, currency, amount, status, created_at FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
      [userId]
    );
    for (const w of (withdrawals.rows || [])) {
      notifs.push({
        id: `wd_${w.id}`,
        icon: 'arrow_upward',
        color: 'purple',
        title: `Withdrawal ${w.status}`,
        subtitle: `${parseFloat(w.amount || 0).toFixed(6)} ${w.currency || ''}`,
        time: w.created_at,
      });
    }

    // Sort by time desc
    notifs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ notifications: notifs.slice(0, 10), unread: notifs.length });
  } catch (err) {
    console.error('Notifications error:', err.message);
    res.json({ notifications: [], unread: 0 });
  }
});

module.exports = router;
