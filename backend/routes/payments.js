const express = require('express');
const { Pool } = require('pg');
const sasaPayService = require('../services/sasapay');
const lunoService = require('../services/luno');
const requireEmailVerification = require('../middleware/requireEmailVerification');
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

// SasaPay Deposit (Kenya)
router.post('/deposit/sasapay', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = req.user.id;
    const reference = `DEP_${Date.now()}_${userId.slice(-6)}`;

    // Create deposit record
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deposits (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        method VARCHAR(50) NOT NULL,
        phone_number VARCHAR(20),
        reference VARCHAR(100),
        transaction_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const depositId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO deposits (id, user_id, amount, currency, method, phone_number, reference, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [depositId, userId, amount, 'KES', 'sasapay', phoneNumber, reference, 'pending']
    );

    // Initiate SasaPay STK Push
    const result = await sasaPayService.initiateDeposit({
      amount,
      phoneNumber,
      reference,
      callbackUrl: `${process.env.BASE_URL || 'https://bpay.onrender.com'}/api/payments/sasapay/callback/deposit`
    });

    if (result.success) {
      // Update with transaction ID
      await pool.query(
        'UPDATE deposits SET transaction_id = $1 WHERE id = $2',
        [result.transactionId, depositId]
      );

      res.json({
        success: true,
        message: 'STK push sent to your phone. Please complete the payment.',
        depositId,
        transactionId: result.transactionId,
        reference
      });
    } else {
      await pool.query(
        'UPDATE deposits SET status = $1 WHERE id = $2',
        ['failed', depositId]
      );

      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('SasaPay deposit error:', error);
    res.status(500).json({ error: 'Deposit failed' });
  }
});

// SasaPay Withdrawal (Kenya)
router.post('/withdraw/sasapay', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = req.user.id;
    const reference = `WTH_${Date.now()}_${userId.slice(-6)}`;

    // Check user balance
    const userResult = await pool.query('SELECT kes_balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = parseFloat(userResult.rows[0].kes_balance || 0);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal record
    await pool.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        method VARCHAR(50) NOT NULL,
        phone_number VARCHAR(20),
        reference VARCHAR(100),
        transaction_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const withdrawalId = `withdrawal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query(
      'INSERT INTO withdrawals (id, user_id, amount, currency, method, phone_number, reference, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [withdrawalId, userId, amount, 'KES', 'sasapay', phoneNumber, reference, 'pending']
    );

    // Deduct from user balance
    await pool.query(
      'UPDATE users SET kes_balance = kes_balance - $1 WHERE id = $2',
      [amount, userId]
    );

    // Initiate SasaPay B2C
    const result = await sasaPayService.initiatePayout({
      amount,
      phoneNumber,
      reference
    });

    if (result.success) {
      await pool.query(
        'UPDATE withdrawals SET transaction_id = $1, status = $2 WHERE id = $3',
        [result.transactionId, 'processing', withdrawalId]
      );

      res.json({
        success: true,
        message: 'Withdrawal initiated. You will receive M-Pesa shortly.',
        withdrawalId,
        transactionId: result.transactionId,
        reference
      });
    } else {
      // Refund balance on failure
      await pool.query(
        'UPDATE users SET kes_balance = kes_balance + $1 WHERE id = $2',
        [amount, userId]
      );
      
      await pool.query(
        'UPDATE withdrawals SET status = $1 WHERE id = $2',
        ['failed', withdrawalId]
      );

      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('SasaPay withdrawal error:', error);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// SasaPay Callback
router.post('/sasapay/callback/deposit', async (req, res) => {
  try {
    const { transaction_id, status, reference, amount } = req.body;
    
    if (status === 'completed') {
      // Update deposit status
      await pool.query(
        'UPDATE deposits SET status = $1 WHERE transaction_id = $2',
        ['completed', transaction_id]
      );

      // Add to user balance
      const depositResult = await pool.query(
        'SELECT user_id FROM deposits WHERE transaction_id = $1',
        [transaction_id]
      );

      if (depositResult.rows.length > 0) {
        await pool.query(
          'UPDATE users SET kes_balance = kes_balance + $1 WHERE id = $2',
          [amount, depositResult.rows[0].user_id]
        );
      }
    } else {
      await pool.query(
        'UPDATE deposits SET status = $1 WHERE transaction_id = $2',
        ['failed', transaction_id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('SasaPay callback error:', error);
    res.status(500).json({ error: 'Callback failed' });
  }
});

module.exports = router;