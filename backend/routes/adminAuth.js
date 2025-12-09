const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Admin Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, assignedRegion } = req.body;

    // Check if admin exists
    const existingAdmin = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const adminId = `admin_${Date.now()}`;

    // Insert admin
    await pool.query(
      `INSERT INTO admins (id, name, email, password, role, assigned_region, permissions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        adminId,
        name,
        email,
        hashedPassword,
        role || 'super_admin',
        assignedRegion || 'ALL',
        role === 'super_admin' ? ['all'] : []
      ]
    );

    // Generate token
    const token = jwt.sign(
      { id: adminId, email, role: role || 'super_admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Admin created successfully',
      token,
      admin: { id: adminId, name, email, role: role || 'super_admin', assignedRegion: assignedRegion || 'ALL' }
    });
  } catch (error) {
    console.error('Admin register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await pool.query('UPDATE admins SET last_active = NOW() WHERE id = $1', [admin.id]);

    // Generate token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        assignedRegion: admin.assigned_region,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
