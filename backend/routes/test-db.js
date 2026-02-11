const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const result = await pool.query('SELECT NOW()');
    await pool.end();

    res.json({
      success: true,
      message: 'Database connected successfully',
      timestamp: result.rows[0].now,
      database: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      database: process.env.DATABASE_URL ? 'URL set but connection failed' : 'URL not set'
    });
  }
});

module.exports = router;