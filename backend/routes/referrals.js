const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Generate referral code
function generateReferralCode(name) {
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  const namePrefix = name.substr(0, 3).toUpperCase();
  return `${namePrefix}${random}`;
}

// Get user referral info
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await pool.query('SELECT referral_code, referral_earnings FROM users WHERE id = $1', [req.params.userId]);
    
    if (!user.rows[0]?.referral_code) {
      const userName = await pool.query('SELECT first_name FROM users WHERE id = $1', [req.params.userId]);
      const code = generateReferralCode(userName.rows[0]?.first_name || 'USER');
      await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, req.params.userId]);
      user.rows[0] = { referral_code: code, referral_earnings: 0 };
    }
    
    const referrals = await pool.query(
      `SELECT r.*, u.first_name, u.last_name, u.created_at as joined_at 
       FROM referrals r 
       JOIN users u ON r.referred_id = u.id 
       WHERE r.referrer_id = $1 
       ORDER BY r.created_at DESC`,
      [req.params.userId]
    );
    
    res.json({
      referralCode: user.rows[0].referral_code,
      earnings: parseFloat(user.rows[0].referral_earnings || 0),
      referrals: referrals.rows,
      totalReferrals: referrals.rows.length
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

// Apply referral code during registration
router.post('/apply', async (req, res) => {
  try {
    const { userId, referralCode } = req.body;
    
    const referrer = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
    
    if (referrer.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    const referrerId = referrer.rows[0].id;
    const id = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await pool.query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrerId, userId]);
    
    await pool.query(
      'INSERT INTO referrals (id, referrer_id, referred_id, referral_code, reward_amount) VALUES ($1, $2, $3, $4, $5)',
      [id, referrerId, userId, referralCode, 500]
    );
    
    res.json({ success: true, message: 'Referral applied! Referrer will earn ₦500 when you complete your first trade.' });
  } catch (error) {
    console.error('Apply referral error:', error);
    res.status(500).json({ error: 'Failed to apply referral' });
  }
});

// Process referral reward (called after first trade)
router.post('/reward/:referralId', async (req, res) => {
  try {
    const referral = await pool.query('SELECT * FROM referrals WHERE id = $1 AND reward_paid = FALSE', [req.params.referralId]);
    
    if (referral.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found or already paid' });
    }
    
    const { referrer_id, reward_amount } = referral.rows[0];
    
    await pool.query('UPDATE users SET referral_earnings = referral_earnings + $1, ngn_balance = ngn_balance + $1 WHERE id = $2', [reward_amount, referrer_id]);
    await pool.query('UPDATE referrals SET reward_paid = TRUE, status = $1 WHERE id = $2', ['completed', req.params.referralId]);
    
    res.json({ success: true, message: 'Referral reward paid!' });
  } catch (error) {
    console.error('Process reward error:', error);
    res.status(500).json({ error: 'Failed to process reward' });
  }
});

module.exports = router;
