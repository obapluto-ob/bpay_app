const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createMainAdmin() {
  try {
    // Create admins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Check if main admin exists
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', ['michealbyers750@gmail.com']);
    
    if (existing.rows.length > 0) {
      console.log('✅ Main admin already exists');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Peace@26', 12);
    const adminId = 'admin_' + Date.now();

    // Create main super admin
    await pool.query(
      'INSERT INTO admins (id, email, password, name, role) VALUES ($1, $2, $3, $4, $5)',
      [adminId, 'michealbyers750@gmail.com', hashedPassword, 'Michael Byers', 'super_admin']
    );

    console.log('✅ Main super admin created successfully!');
    console.log('📧 Email: michealbyers750@gmail.com');
    console.log('🔑 Password: Peace@26');
    console.log('👑 Role: Super Admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMainAdmin();
