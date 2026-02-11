const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new admin (only super_admin can do this)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, superAdminEmail, superAdminPassword } = req.body;

    // Verify super admin credentials
    const superAdmin = await pool.query('SELECT * FROM admins WHERE email = $1 AND role = $2', [superAdminEmail, 'super_admin']);
    if (superAdmin.rows.length === 0) {
      return res.status(403).json({ error: 'Only super admin can create new admins' });
    }

    const isMatch = await bcrypt.compare(superAdminPassword, superAdmin.rows[0].password);
    if (!isMatch) {
      return res.status(403).json({ error: 'Invalid super admin credentials' });
    }

    // Check if admin exists
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 12);
    const adminId = 'admin_' + Date.now();

    await pool.query(
      'INSERT INTO admins (id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)',
      [adminId, email, hashedPassword, name, role || 'admin']
    );

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
