const express = require('express');
const router = express.Router();
const { query: dbQuery } = require('../config/db');
const pool = { query: dbQuery };

// Get current rates
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT crypto, buy_rate, sell_rate, updated_at FROM crypto_rates WHERE is_active = 1 ORDER BY crypto'
    );
    
    const rates = {};
    result.rows.forEach(row => {
      rates[row.crypto] = {
        buy: row.buy_rate,
        sell: row.sell_rate,
        lastUpdated: row.updated_at
      };
    });
    
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// Admin: Update rates
router.put('/:crypto', async (req, res) => {
  const { crypto } = req.params;
  const { buyRate, sellRate } = req.body;
  
  try {
    await pool.query(
      "INSERT INTO crypto_rates (crypto, buy_rate, sell_rate, updated_at, is_active) VALUES ($1, $2, $3, datetime('now'), 1) ON CONFLICT (crypto) DO UPDATE SET buy_rate = $2, sell_rate = $3, updated_at = datetime('now')",
      [crypto, buyRate, sellRate]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rates' });
  }
});

module.exports = router;