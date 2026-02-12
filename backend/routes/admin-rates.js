const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get current rates (public - no auth needed)
router.get('/rates', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT crypto, usd_price, ngn_rate, kes_rate, buy_margin, sell_margin, updated_at 
      FROM crypto_rates 
      ORDER BY crypto
    `);
    
    const rates = {};
    result.rows.forEach(row => {
      rates[row.crypto] = {
        usd: row.usd_price,
        ngn: row.ngn_rate,
        kes: row.kes_rate,
        buyMargin: row.buy_margin,
        sellMargin: row.sell_margin,
        updatedAt: row.updated_at
      };
    });
    
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// Update rates (super admin only)
router.post('/rates/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const adminResult = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user?.id || 0]);
    if (!adminResult.rows[0] || adminResult.rows[0].role !== 'Super Admin') {
      return res.status(403).json({ error: 'Super admin only' });
    }

    const { crypto, usdPrice, ngnRate, kesRate, buyMargin, sellMargin } = req.body;

    await pool.query(`
      INSERT INTO crypto_rates (crypto, usd_price, ngn_rate, kes_rate, buy_margin, sell_margin, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (crypto) 
      DO UPDATE SET 
        usd_price = $2, 
        ngn_rate = $3, 
        kes_rate = $4, 
        buy_margin = $5, 
        sell_margin = $6, 
        updated_at = NOW()
    `, [crypto, usdPrice, ngnRate, kesRate, buyMargin || 0.02, sellMargin || 0.02]);

    res.json({ success: true, message: `${crypto} rate updated` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rate' });
  }
});

// Bulk update from external API (super admin only)
router.post('/rates/sync', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const adminResult = await pool.query('SELECT * FROM admins WHERE id = $1', [req.user?.id || 0]);
    if (!adminResult.rows[0] || adminResult.rows[0].role !== 'Super Admin') {
      return res.status(403).json({ error: 'Super admin only' });
    }

    // Fetch from CoinGecko
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,ripple,solana&vs_currencies=usd');
    const data = await response.json();

    // Fetch exchange rates
    const exchangeResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const exchangeData = await exchangeResponse.json();
    const USDNGN = exchangeData.rates?.NGN || 1600;
    const USDKES = exchangeData.rates?.KES || 150;

    const cryptoMap = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      tether: 'USDT',
      ripple: 'XRP',
      solana: 'SOL'
    };

    for (const [key, crypto] of Object.entries(cryptoMap)) {
      const usdPrice = data[key]?.usd || 0;
      const ngnRate = Math.round(usdPrice * USDNGN);
      const kesRate = Math.round(usdPrice * USDKES);

      await pool.query(`
        INSERT INTO crypto_rates (crypto, usd_price, ngn_rate, kes_rate, buy_margin, sell_margin, updated_at)
        VALUES ($1, $2, $3, $4, 0.02, 0.02, NOW())
        ON CONFLICT (crypto) 
        DO UPDATE SET 
          usd_price = $2, 
          ngn_rate = $3, 
          kes_rate = $4, 
          updated_at = NOW()
      `, [crypto, usdPrice, ngnRate, kesRate]);
    }

    res.json({ success: true, message: 'Rates synced from CoinGecko' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync rates' });
  }
});

module.exports = router;
