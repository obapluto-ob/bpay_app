const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

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

console.log('Avatar routes loaded, JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Upload avatar (base64)
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    console.log('Avatar upload request received');
    const { avatar } = req.body;
    const userId = req.user?.id;

    console.log('User ID:', userId);
    console.log('Avatar data length:', avatar?.length);

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data required' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Ensure avatar column exists
    try {
      await pool.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar') THEN
            ALTER TABLE users ADD COLUMN avatar TEXT;
          END IF;
        END $$;
      `);
    } catch (columnError) {
      console.log('Avatar column check/creation:', columnError.message);
    }

    // Store base64 avatar in database
    const result = await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2 RETURNING id',
      [avatar, userId]
    );

    console.log('Database update result:', result.rowCount);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Avatar updated successfully',
      avatarUrl: avatar 
    });
  } catch (error) {
    console.error('Avatar upload error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get avatar
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Get avatar request received');
    const userId = req.user?.id;
    
    console.log('User ID:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await pool.query('SELECT avatar FROM users WHERE id = $1', [userId]);
    console.log('Database query result:', result.rowCount);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ avatar: result.rows[0].avatar });
  } catch (error) {
    console.error('Get avatar error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

module.exports = router;