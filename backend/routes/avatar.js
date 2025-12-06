const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Upload avatar (base64)
router.post('/upload', auth, async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user.id;

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data required' });
    }

    // Store base64 avatar in database
    await db.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatar, userId]
    );

    res.json({ 
      message: 'Avatar updated successfully',
      avatarUrl: avatar 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get avatar
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query('SELECT avatar FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ avatar: result.rows[0].avatar });
  } catch (error) {
    console.error('Get avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;