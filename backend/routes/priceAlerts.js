const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Create price alert
router.post('/create', async (req, res) => {
  try {
    const { userId, crypto, targetPrice, condition, currency } = req.body;
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO price_alerts (id, user_id, crypto, target_price, condition, currency) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, userId, crypto, targetPrice, condition, currency]
    );
    
    res.json({ success: true, alertId: id });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Get user alerts
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM price_alerts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json({ alerts: result.rows });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Delete alert
router.delete('/:alertId', async (req, res) => {
  try {
    await pool.query('DELETE FROM price_alerts WHERE id = $1', [req.params.alertId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Toggle alert
router.put('/:alertId/toggle', async (req, res) => {
  try {
    await pool.query(
      'UPDATE price_alerts SET is_active = NOT is_active WHERE id = $1',
      [req.params.alertId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Toggle alert error:', error);
    res.status(500).json({ error: 'Failed to toggle alert' });
  }
});

module.exports = router;
