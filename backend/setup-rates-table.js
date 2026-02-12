const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupRatesTable() {
  try {
    console.log('Creating crypto_rates table...');
    
    await pool.query(`
      DROP TABLE IF EXISTS crypto_rates;
      CREATE TABLE crypto_rates (
        id SERIAL PRIMARY KEY,
        crypto VARCHAR(10) UNIQUE NOT NULL,
        usd_price DECIMAL(15,2) NOT NULL,
        ngn_rate DECIMAL(15,2) NOT NULL,
        kes_rate DECIMAL(15,2) NOT NULL,
        buy_margin DECIMAL(5,4) DEFAULT 0.02,
        sell_margin DECIMAL(5,4) DEFAULT 0.02,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Inserting initial rates...');
    
    await pool.query(`
      INSERT INTO crypto_rates (crypto, usd_price, ngn_rate, kes_rate) VALUES
      ('BTC', 95000, 152000000, 14250000),
      ('ETH', 3400, 5440000, 510000),
      ('USDT', 1, 1600, 150),
      ('XRP', 2.5, 4000, 375),
      ('SOL', 200, 320000, 30000)
      ON CONFLICT (crypto) DO NOTHING;
    `);
    
    console.log('✅ Crypto rates table created successfully!');
    
    const result = await pool.query('SELECT * FROM crypto_rates ORDER BY crypto');
    console.log('\nCurrent rates:');
    result.rows.forEach(row => {
      console.log(`${row.crypto}: $${row.usd_price} | ₦${row.ngn_rate} | KSh${row.kes_rate}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupRatesTable();
