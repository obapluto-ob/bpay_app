const express = require('express');
const { Pool } = require('pg');
const auth = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Mock admin data (in production, this would be from database)
const mockAdmins = [
  {
    id: 'admin_trade_1',
    name: 'John Trade Admin',
    email: 'john@bpay.com',
    role: 'trade_admin',
    region: 'NG',
    averageRating: 4.8,
    responseTime: 5,
    currentLoad: 2,
    isOnline: true
  },
  {
    id: 'admin_trade_2', 
    name: 'Sarah Trade Admin',
    email: 'sarah@bpay.com',
    role: 'trade_admin',
    region: 'KE',
    averageRating: 4.6,
    responseTime: 8,
    currentLoad: 1,
    isOnline: true
  },
  {
    id: 'admin_super',
    name: 'Super Admin',
    email: 'super@bpay.com',
    role: 'super_admin',
    region: 'ALL',
    averageRating: 4.9,
    responseTime: 3,
    currentLoad: 0,
    isOnline: true
  }
];

// Get available admins
router.get('/available', auth, async (req, res) => {
  try {
    // Filter online admins
    const availableAdmins = mockAdmins.filter(admin => admin.isOnline);
    
    res.json({
      success: true,
      admins: availableAdmins
    });
  } catch (error) {
    console.error('Error fetching available admins:', error);
    res.status(500).json({ error: 'Failed to fetch available admins' });
  }
});

// Assign best admin to trade
router.post('/assign/:tradeId', auth, async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { userCountry, tradeType, amount } = req.body;
    
    // Get best available admin
    const bestAdmin = getBestAdmin(userCountry, tradeType, amount);
    
    if (!bestAdmin) {
      return res.status(404).json({ error: 'No available admin found' });
    }
    
    // In production, save assignment to database
    // await pool.query('UPDATE trades SET assigned_admin = $1 WHERE id = $2', [bestAdmin.id, tradeId]);
    
    res.json({
      success: true,
      assignedAdmin: bestAdmin,
      message: `Trade ${tradeId} assigned to ${bestAdmin.name}`
    });
    
  } catch (error) {
    console.error('Error assigning admin:', error);
    res.status(500).json({ error: 'Failed to assign admin' });
  }
});

// Get admin performance stats
router.get('/performance', auth, async (req, res) => {
  try {
    const stats = mockAdmins.map(admin => ({
      ...admin,
      totalTrades: Math.floor(Math.random() * 100) + 50,
      completionRate: (Math.random() * 0.1 + 0.9) * 100, // 90-100%
      averageResponseTime: admin.responseTime
    }));
    
    res.json({
      success: true,
      adminStats: stats
    });
  } catch (error) {
    console.error('Error fetching admin performance:', error);
    res.status(500).json({ error: 'Failed to fetch admin performance' });
  }
});

// Helper function to get best admin
function getBestAdmin(userCountry, tradeType, amount) {
  const availableAdmins = mockAdmins
    .filter(admin => admin.isOnline)
    .filter(admin => admin.region === userCountry || admin.region === 'ALL')
    .sort((a, b) => {
      // Priority: Rating > Response Time > Current Load
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      if (a.responseTime !== b.responseTime) {
        return a.responseTime - b.responseTime;
      }
      return a.currentLoad - b.currentLoad;
    });
    
  return availableAdmins[0] || null;
}

module.exports = router;