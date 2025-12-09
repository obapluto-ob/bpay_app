const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, 'src', 'database', 'migration_add_order_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('\n📊 Existing tables:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check if order_id column exists in trades
    const orderIdCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trades' AND column_name = 'order_id'
    `);

    if (orderIdCheck.rows.length > 0) {
      console.log('\n✅ order_id column exists in trades table');
      
      // Show sample order IDs
      const sampleOrders = await pool.query('SELECT id, order_id FROM trades LIMIT 5');
      if (sampleOrders.rows.length > 0) {
        console.log('\n📋 Sample order IDs:');
        sampleOrders.rows.forEach(order => {
          console.log(`   Order #${order.order_id} (${order.id})`);
        });
      }
    } else {
      console.log('\n⚠️  order_id column not found in trades table');
    }

    // Check admins table
    const adminsCount = await pool.query('SELECT COUNT(*) FROM admins');
    console.log(`\n👥 Admins in database: ${adminsCount.rows[0].count}`);

    console.log('\n✨ Database setup completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Deploy backend to Render');
    console.log('   2. All new trades will have unique 9-digit order IDs');
    console.log('   3. Admin dashboard will display order IDs prominently');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
