const { Pool } = require('pg');
require('dotenv').config();

async function addAvatarColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Adding avatar column to users table...');
    await pool.query('ALTER TABLE users ADD COLUMN avatar TEXT;');
    console.log('Avatar column added successfully!');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Avatar column already exists');
    } else {
      console.error('Error adding avatar column:', error.message);
    }
  } finally {
    await pool.end();
  }
}

addAvatarColumn();