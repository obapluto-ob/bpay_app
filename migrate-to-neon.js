const { Pool } = require('pg');

const renderDb = new Pool({
  connectionString: 'postgresql://bpay_db_user:E4j75M783UcbOQ8EhJ03FxrUQ7W0B9t8@dpg-d4k7vqjuibrs73faqfn0-a.oregon-postgres.render.com/bpay_db',
  ssl: { rejectUnauthorized: false }
});

const neonDb = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_XZA1C7yweMBG@ep-steep-grass-aiowntjq-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrateData() {
  try {
    console.log('🔄 Starting migration from Render to Neon...\n');

    // Test Render connection first
    console.log('Testing Render database connection...');
    try {
      await renderDb.query('SELECT 1');
      console.log('✅ Render database connected\n');
    } catch (error) {
      console.error('❌ Cannot connect to Render database:', error.message);
      console.log('\n⚠️ Render database might be suspended or unavailable.');
      console.log('\nOptions:');
      console.log('1. Wait for Render to wake up (if suspended)');
      console.log('2. Start fresh with Neon (create tables manually)');
      return;
    }

    // Test Neon connection
    console.log('Testing Neon database connection...');
    await neonDb.query('SELECT 1');
    console.log('✅ Neon database connected\n');

    // Get all tables
    const tables = await renderDb.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);

    console.log(`📊 Found ${tables.rows.length} tables to migrate\n`);

    for (const table of tables.rows) {
      const tableName = table.tablename;
      console.log(`📦 Migrating table: ${tableName}`);

      // Get table schema
      const schema = await renderDb.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      // Get all data
      const data = await renderDb.query(`SELECT * FROM ${tableName}`);
      console.log(`   ✅ Exported ${data.rows.length} rows`);

      if (data.rows.length > 0) {
        // Insert data into Neon
        for (const row of data.rows) {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

          await neonDb.query(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        }
        console.log(`   ✅ Imported ${data.rows.length} rows to Neon\n`);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await renderDb.end();
    await neonDb.end();
  }
}

migrateData();