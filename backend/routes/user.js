const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = 'SELECT id, email, first_name, last_name, country, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      country: user.country || 'NG',
      kycStatus: 'pending',
      isVerified: true,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get user balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = 'SELECT btc_balance, eth_balance, usdt_balance, ngn_balance, kes_balance FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.json({ BTC: 0, ETH: 0, USDT: 0, NGN: 0, KES: 0 });
    }
    
    const user = result.rows[0];
    res.json({
      BTC: parseFloat(user.btc_balance) || 0,
      ETH: parseFloat(user.eth_balance) || 0,
      USDT: parseFloat(user.usdt_balance) || 0,
      NGN: parseFloat(user.ngn_balance) || 0,
      KES: parseFloat(user.kes_balance) || 0
    });
  } catch (error) {
    console.error('Balance error:', error);
    res.json({ BTC: 0, ETH: 0, USDT: 0, NGN: 0, KES: 0 });
  }
});

// Submit KYC
router.post('/kyc', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, documentNumber, documentImage, selfieImage } = req.body;
    
    // Update user KYC status
    const query = `
      UPDATE users 
      SET kyc_status = 'processing', 
          document_type = $2, 
          document_number = $3,
          updated_at = $4
      WHERE id = $1
    `;
    
    await pool.query(query, [userId, documentType, documentNumber, new Date().toISOString()]);
    
    res.json({ 
      success: true, 
      message: 'KYC submitted successfully',
      kycStatus: 'processing'
    });
  } catch (error) {
    console.error('KYC error:', error);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

// Submit deposit
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency, paymentMethod, reference } = req.body;
    
    // Create deposit record
    const depositId = 'dep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const query = `
      INSERT INTO deposits (id, user_id, amount, currency, payment_method, reference, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    const values = [
      depositId,
      userId,
      amount,
      currency,
      paymentMethod,
      reference,
      'pending',
      new Date().toISOString()
    ];
    
    await pool.query(query, values);
    
    res.json({ 
      success: true, 
      message: 'Deposit submitted for verification',
      depositId
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to submit deposit' });
  }
});

// Get crypto wallets
router.get('/crypto-wallets', authenticateToken, async (req, res) => {
  try {
    // Return company wallet addresses for deposits
    res.json({
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      ETH: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e4e4',
      USDT: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e4e4'
    });
  } catch (error) {
    console.error('Crypto wallets error:', error);
    res.status(500).json({ error: 'Failed to fetch crypto wallets' });
  }
});

module.exports = router;