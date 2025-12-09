const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Super admin auth middleware
const authenticateSuperAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if super admin
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// System health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      issues: [],
      warnings: [],
      metrics: {}
    };

    // 1. Check user balances vs system reserves
    const balanceCheck = await pool.query(`
      SELECT 
        SUM(btc_balance) as total_btc,
        SUM(eth_balance) as total_eth,
        SUM(usdt_balance) as total_usdt,
        SUM(ngn_balance) as total_ngn,
        SUM(kes_balance) as total_kes,
        COUNT(*) as total_users
      FROM users
    `);
    
    health.metrics.userBalances = balanceCheck.rows[0];

    // 2. Check pending trades (money in limbo)
    const pendingTrades = await pool.query(`
      SELECT 
        COUNT(*) as count,
        SUM(fiat_amount) as total_fiat,
        SUM(crypto_amount) as total_crypto
      FROM trades 
      WHERE status = 'pending'
    `);
    
    health.metrics.pendingTrades = pendingTrades.rows[0];
    
    if (parseInt(pendingTrades.rows[0].count) > 50) {
      health.warnings.push({
        type: 'high_pending_trades',
        message: `${pendingTrades.rows[0].count} pending trades - may need more admins`,
        severity: 'medium'
      });
    }

    // 3. Calculate platform profit
    const profitCalc = await pool.query(`
      SELECT 
        COUNT(*) as completed_trades,
        SUM(CASE WHEN type = 'buy' THEN fiat_amount * 0.02 ELSE 0 END) as buy_profit,
        SUM(CASE WHEN type = 'sell' THEN fiat_amount * 0.02 ELSE 0 END) as sell_profit,
        SUM(fiat_amount * 0.02) as total_profit
      FROM trades 
      WHERE status = 'completed'
    `);
    
    health.metrics.profit = profitCalc.rows[0];

    // 4. Check for stuck trades (pending > 24 hours)
    const stuckTrades = await pool.query(`
      SELECT COUNT(*) as count
      FROM trades 
      WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '24 hours'
    `);
    
    if (parseInt(stuckTrades.rows[0].count) > 0) {
      health.issues.push({
        type: 'stuck_trades',
        message: `${stuckTrades.rows[0].count} trades pending for over 24 hours`,
        severity: 'high',
        action: 'Review and resolve immediately'
      });
      health.status = 'warning';
    }

    // 5. Check dispute rate
    const disputeRate = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM disputes WHERE status = 'open') as open_disputes,
        (SELECT COUNT(*) FROM trades WHERE status = 'completed') as completed_trades
    `);
    
    const disputes = parseInt(disputeRate.rows[0].open_disputes);
    const completed = parseInt(disputeRate.rows[0].completed_trades);
    const rate = completed > 0 ? (disputes / completed) * 100 : 0;
    
    health.metrics.disputeRate = {
      open: disputes,
      rate: rate.toFixed(2) + '%'
    };
    
    if (rate > 5) {
      health.warnings.push({
        type: 'high_dispute_rate',
        message: `Dispute rate at ${rate.toFixed(2)}% (target: <3%)`,
        severity: 'medium'
      });
    }

    // 6. Check admin performance
    const adminPerf = await pool.query(`
      SELECT 
        COUNT(*) as total_admins,
        SUM(CASE WHEN COALESCE(is_online, false) = true THEN 1 ELSE 0 END) as online_admins
      FROM admins
    `);
    
    health.metrics.admins = adminPerf.rows[0];
    
    if (parseInt(adminPerf.rows[0].online_admins) === 0) {
      health.issues.push({
        type: 'no_online_admins',
        message: 'No admins currently online - trades cannot be processed',
        severity: 'critical',
        action: 'Activate admin accounts immediately'
      });
      health.status = 'critical';
    }

    // 7. Check for balance mismatches
    const mismatchCheck = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.btc_balance,
        u.eth_balance,
        u.usdt_balance
      FROM users u
      WHERE 
        u.btc_balance < 0 OR 
        u.eth_balance < 0 OR 
        u.usdt_balance < 0 OR
        u.ngn_balance < 0 OR
        u.kes_balance < 0
    `);
    
    if (mismatchCheck.rows.length > 0) {
      health.issues.push({
        type: 'negative_balances',
        message: `${mismatchCheck.rows.length} users have negative balances`,
        severity: 'critical',
        action: 'Investigate and correct immediately',
        affected_users: mismatchCheck.rows.map(u => u.email)
      });
      health.status = 'critical';
    }

    // 8. Check failed deposits
    const failedDeposits = await pool.query(`
      SELECT COUNT(*) as count
      FROM deposits 
      WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '48 hours'
    `);
    
    if (parseInt(failedDeposits.rows[0].count) > 0) {
      health.warnings.push({
        type: 'old_pending_deposits',
        message: `${failedDeposits.rows[0].count} deposits pending for over 48 hours`,
        severity: 'medium'
      });
    }

    // 9. Calculate daily metrics
    const dailyMetrics = await pool.query(`
      SELECT 
        COUNT(*) as trades_today,
        SUM(fiat_amount) as volume_today,
        SUM(fiat_amount * 0.02) as profit_today
      FROM trades 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      AND status = 'completed'
    `);
    
    health.metrics.today = dailyMetrics.rows[0];

    // 10. System recommendations
    health.recommendations = [];
    
    if (parseFloat(health.metrics.profit.total_profit || 0) < 10000) {
      health.recommendations.push('Consider marketing campaigns to increase trade volume');
    }
    

    
    if (parseInt(health.metrics.userBalances.total_users) < 100) {
      health.recommendations.push('User base is small - focus on user acquisition');
    }

    res.json(health);
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to check system health',
      details: error.message 
    });
  }
});

// Profit & Loss Report
router.get('/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const report = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as trades,
        SUM(CASE WHEN type = 'buy' THEN 1 ELSE 0 END) as buy_trades,
        SUM(CASE WHEN type = 'sell' THEN 1 ELSE 0 END) as sell_trades,
        SUM(fiat_amount) as total_volume,
        SUM(fiat_amount * 0.02) as gross_profit,
        SUM(fiat_amount * 0.02) * 0.7 as net_profit
      FROM trades 
      WHERE status = 'completed'
      ${startDate ? `AND created_at >= '${startDate}'` : ''}
      ${endDate ? `AND created_at <= '${endDate}'` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(fiat_amount) as total_volume,
        SUM(fiat_amount * 0.02) as total_gross_profit,
        SUM(fiat_amount * 0.02) * 0.7 as total_net_profit,
        AVG(fiat_amount * 0.02) as avg_profit_per_trade
      FROM trades 
      WHERE status = 'completed'
      ${startDate ? `AND created_at >= '${startDate}'` : ''}
      ${endDate ? `AND created_at <= '${endDate}'` : ''}
    `);
    
    res.json({
      summary: summary.rows[0],
      daily: report.rows,
      feeStructure: {
        buyMarkup: '2%',
        sellMarkdown: '2%',
        netMargin: '70%',
        operatingCosts: '30%'
      }
    });
  } catch (error) {
    console.error('P&L report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
