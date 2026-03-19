const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const lunoService = require('../services/luno');
const { ASSET_MAP } = require('../services/luno');
const jwt = require('jsonwebtoken');

const SUPPORTED_ASSETS = Object.keys(ASSET_MAP).filter(a => a !== 'KES'); // KES is fiat on Luno

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

// GET /api/luno/address?asset=XBT — get or generate unique deposit address per user per asset
router.get('/address', auth, async (req, res) => {
  const asset = (req.query.asset || 'XBT').toUpperCase();
  const userId = req.user.id;

  if (!SUPPORTED_ASSETS.includes(asset)) {
    return res.status(400).json({ error: `Unsupported asset: ${asset}` });
  }

  try {
    const existing = await query(
      'SELECT address FROM user_crypto_addresses WHERE user_id = ? AND currency = ?',
      [userId, asset]
    );
    if (existing.rows.length > 0) return res.json({ address: existing.rows[0].address, asset });

    const result = await lunoService.createReceiveAddress(asset);
    if (!result.success) return res.status(400).json({ error: result.error });

    await query(
      'INSERT OR IGNORE INTO user_crypto_addresses (user_id, currency, address, address_id) VALUES (?, ?, ?, ?)',
      [userId, asset, result.address, result.addressId || '']
    );
    res.json({ address: result.address, asset });
  } catch (error) {
    console.error('Luno address error:', error);
    res.status(500).json({ error: 'Failed to generate address' });
  }
});

// GET /api/luno/balances — all Luno wallet balances (admin/debug)
router.get('/balances', auth, async (req, res) => {
  try {
    const result = await lunoService.getAllBalances();
    if (result.success) return res.json({ success: true, balances: result.balances });
    res.status(400).json({ error: result.error });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// POST /api/luno/webhook — Luno deposit notification
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'RECEIVE' && data) {
      await _creditDeposit(data.address, parseFloat(data.amount), data.currency || 'XBT', data.transaction_id);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook failed' });
  }
});

// GET /api/luno/poll?asset=XBT — poll Luno transactions and credit any new deposits
router.get('/poll', async (req, res) => {
  const asset = (req.query.asset || 'XBT').toUpperCase();
  if (!SUPPORTED_ASSETS.includes(asset)) {
    return res.status(400).json({ error: `Unsupported asset: ${asset}. Supported: ${SUPPORTED_ASSETS.join(', ')}` });
  }
    const result = await lunoService.getTransactions(asset);
    if (!result.success) return res.status(400).json({ error: result.error });

    let credited = 0;
    for (const tx of result.transactions) {
      if (parseFloat(tx.balance_delta) > 0) {
        const addr = tx.details?.funding_address || tx.details?.address || '';
        if (addr) {
          const credited_result = await _creditDeposit(addr, parseFloat(tx.balance_delta), asset, String(tx.row_index));
          if (credited_result) credited++;
        }
      }
    }
    res.json({ success: true, asset, credited, scanned: result.transactions.length });
  } catch (error) {
    console.error('Poll error:', error);
    res.status(500).json({ error: 'Poll failed' });
  }
});

// Internal: credit deposit to user, returns true if credited
async function _creditDeposit(address, amount, asset, txId) {
  const col = lunoService.getBalanceCol(asset);
  if (!col) return false;

  const dup = await query('SELECT id FROM crypto_deposits WHERE luno_transaction_id = ?', [txId]);
  if (dup.rows.length > 0) return false;

  const userAddr = await query(
    'SELECT user_id FROM user_crypto_addresses WHERE address = ? AND currency = ?',
    [address, asset]
  );
  if (userAddr.rows.length === 0) return false;

  const userId = userAddr.rows[0].user_id;
  await query(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`, [amount, userId]);
  await query(
    'INSERT INTO crypto_deposits (id, user_id, currency, amount, luno_transaction_id, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`DEP_${Date.now()}`, userId, asset, amount, txId, address, 'completed']
  );
  console.log(`✅ Credited ${amount} ${asset} to user ${userId}`);
  return true;
}

module.exports = router;
