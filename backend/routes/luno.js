const express = require('express');
const { Pool } = require('pg');
const lunoService = require('../services/luno');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Get crypto balances
router.get('/balance', async (req, res) => {
  try {
    const result = await lunoService.getBalance();
    if (result.success) {
      res.json({ success: true, balances: result.balances });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Luno balance error:', error);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Generate deposit address for user
router.post('/deposit/address', async (req, res) => {
  try {
    const { userId, currency } = req.body;
    
    // Check if user already has an address for this currency
    const existing = await pool.query(
      'SELECT luno_address FROM user_crypto_addresses WHERE user_id = $1 AND currency = $2',
      [userId, currency]
    );
    
    if (existing.rows.length > 0) {
      return res.json({
        success: true,
        address: existing.rows[0].luno_address,
        message: 'Using existing deposit address'
      });
    }
    
    const result = await lunoService.createReceiveAddress(currency);
    
    if (result.success) {
      // Store address for user
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_crypto_addresses (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          currency VARCHAR(10) NOT NULL,
          luno_address VARCHAR(255) NOT NULL,
          luno_address_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await pool.query(
        'INSERT INTO user_crypto_addresses (user_id, currency, luno_address, luno_address_id) VALUES ($1, $2, $3, $4)',
        [userId, currency, result.address, result.addressId]
      );
      
      res.json({
        success: true,
        address: result.address,
        message: 'New deposit address generated'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Luno address error:', error);
    res.status(500).json({ error: 'Failed to generate address' });
  }
});

// Process crypto withdrawal
router.post('/withdrawal/send', async (req, res) => {
  try {
    const { userId, currency, amount, address, reference } = req.body;
    
    // Check user balance
    const user = await pool.query(`SELECT ${currency.toLowerCase()}_balance FROM users WHERE id = $1`, [userId]);
    const balance = parseFloat(user.rows[0]?.[`${currency.toLowerCase()}_balance`] || 0);
    
    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Send via Luno
    const result = await lunoService.sendCrypto({
      currency,
      amount,
      address,
      reference
    });
    
    if (result.success) {
      // Deduct from user balance
      await pool.query(
        `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance - $1 WHERE id = $2`,
        [amount, userId]
      );
      
      // Record withdrawal
      const withdrawalId = `LUNO_${Date.now()}_${userId}`;
      await pool.query(`
        INSERT INTO crypto_withdrawals (id, user_id, currency, amount, address, luno_withdrawal_id, fee, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [withdrawalId, userId, currency, amount, address, result.withdrawalId, result.fee, 'processing']);
      
      res.json({
        success: true,
        withdrawalId,
        lunoWithdrawalId: result.withdrawalId,
        fee: result.fee,
        message: 'Withdrawal initiated successfully'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Luno withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Check withdrawal status
router.get('/withdrawal/:withdrawalId/status', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    
    // Get Luno withdrawal ID from database
    const withdrawal = await pool.query(
      'SELECT luno_withdrawal_id FROM crypto_withdrawals WHERE id = $1',
      [withdrawalId]
    );
    
    if (withdrawal.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    const lunoWithdrawalId = withdrawal.rows[0].luno_withdrawal_id;
    const result = await lunoService.getWithdrawalStatus(lunoWithdrawalId);
    
    if (result.success) {
      // Update local status
      await pool.query(
        'UPDATE crypto_withdrawals SET status = $1 WHERE id = $2',
        [result.status, withdrawalId]
      );
      
      res.json({
        success: true,
        status: result.status,
        data: result.data
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Withdrawal status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Webhook for Luno notifications
router.post('/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'RECEIVE') {
      // Handle incoming crypto deposit
      const { address, amount, currency, transaction_id } = data;
      
      // Find user by address
      const userAddress = await pool.query(
        'SELECT user_id FROM user_crypto_addresses WHERE luno_address = $1 AND currency = $2',
        [address, currency]
      );
      
      if (userAddress.rows.length > 0) {
        const userId = userAddress.rows[0].user_id;
        
        // Credit user balance
        await pool.query(
          `UPDATE users SET ${currency.toLowerCase()}_balance = ${currency.toLowerCase()}_balance + $1 WHERE id = $2`,
          [amount, userId]
        );
        
        // Record deposit
        await pool.query(`
          INSERT INTO crypto_deposits (id, user_id, currency, amount, luno_transaction_id, status, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [`LUNO_DEP_${Date.now()}`, userId, currency, amount, transaction_id, 'completed']);
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Luno webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;