const express = require('express');
const { Pool } = require('pg');
const sasaPayService = require('../services/sasapay');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Initiate SasaPay deposit
router.post('/deposit/initiate', async (req, res) => {
  try {
    const { userId, amount, phoneNumber } = req.body;
    const reference = `DEP_${Date.now()}_${userId}`;
    const callbackUrl = `${process.env.BASE_URL}/api/sasapay/callback/deposit`;

    const result = await sasaPayService.initiateDeposit({
      amount,
      phoneNumber,
      reference,
      callbackUrl
    });

    if (result.success) {
      // Store pending deposit
      await pool.query(`
        INSERT INTO deposits (id, user_id, amount, currency, payment_method, reference, status, sasapay_transaction_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [reference, userId, amount, 'KES', 'sasapay', reference, 'pending', result.transactionId]);

      res.json({
        success: true,
        reference,
        transactionId: result.transactionId,
        message: 'Check your phone for M-Pesa prompt'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('SasaPay deposit error:', error);
    res.status(500).json({ error: 'Failed to initiate deposit' });
  }
});

// Initiate SasaPay withdrawal
router.post('/withdrawal/initiate', async (req, res) => {
  try {
    const { userId, amount, phoneNumber } = req.body;
    const reference = `WTH_${Date.now()}_${userId}`;

    // Check user balance
    const user = await pool.query('SELECT kes_balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(user.rows[0]?.kes_balance || 0);

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const result = await sasaPayService.initiatePayout({
      amount,
      phoneNumber,
      reference
    });

    if (result.success) {
      // Lock funds and create withdrawal record
      await pool.query('UPDATE users SET kes_balance = kes_balance - $1 WHERE id = $2', [amount, userId]);
      
      await pool.query(`
        INSERT INTO withdrawals (id, user_id, amount, currency, phone_number, status, sasapay_transaction_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [reference, userId, amount, 'KES', phoneNumber, 'processing', result.transactionId]);

      res.json({
        success: true,
        reference,
        transactionId: result.transactionId,
        message: 'Withdrawal initiated. Funds will be sent to your M-Pesa shortly.'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('SasaPay withdrawal error:', error);
    res.status(500).json({ error: 'Failed to initiate withdrawal' });
  }
});

// SasaPay deposit callback
router.post('/callback/deposit', async (req, res) => {
  try {
    const { transaction_id, status, reference, amount, phone_number } = req.body;

    if (status === 'completed') {
      // Update deposit status and credit user
      await pool.query('UPDATE deposits SET status = $1 WHERE reference = $2', ['completed', reference]);
      
      const deposit = await pool.query('SELECT user_id FROM deposits WHERE reference = $1', [reference]);
      const userId = deposit.rows[0]?.user_id;
      
      if (userId) {
        await pool.query('UPDATE users SET kes_balance = kes_balance + $1 WHERE id = $2', [amount, userId]);
      }
    } else if (status === 'failed') {
      await pool.query('UPDATE deposits SET status = $1 WHERE reference = $2', ['failed', reference]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('SasaPay callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Check transaction status
router.get('/status/:transactionId', async (req, res) => {
  try {
    const result = await sasaPayService.checkTransactionStatus(req.params.transactionId);
    res.json(result);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

module.exports = router;