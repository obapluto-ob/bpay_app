const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

console.log('Avatar routes loaded, JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Upload avatar (base64)
router.post('/upload', auth, async (req, res) => {
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
      await db.query(`
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
    const result = await db.query(
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
router.get('/', auth, async (req, res) => {
  try {
    console.log('Get avatar request received');
    const userId = req.user?.id;
    
    console.log('User ID:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await db.query('SELECT avatar FROM users WHERE id = $1', [userId]);
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