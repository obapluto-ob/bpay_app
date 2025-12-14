const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const http = require('http');
const websocketService = require('./src/services/websocket');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Auto-migrate database on startup
async function initDatabase() {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('Initializing database...');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      const schemaPath = path.join(__dirname, 'src/database/simple_schema.sql');
      if (fs.existsSync(schemaPath)) {
        // Only create tables if they don't exist (preserves data)
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('Database schema initialized (tables created if not exist)');
      }
      
      // Force add avatar column
      try {
        const checkColumn = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'avatar'
        `);
        
        if (checkColumn.rows.length === 0) {
          await pool.query('ALTER TABLE users ADD COLUMN avatar TEXT;');
          console.log('Avatar column added successfully!');
        } else {
          console.log('Avatar column already exists');
        }
      } catch (error) {
        console.log('Avatar column migration error:', error.message);
      }
      
      // Add chat tables
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            trade_id VARCHAR(255) NOT NULL,
            sender_id VARCHAR(255) NOT NULL,
            sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'admin')),
            message TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS admin_chat_messages (
            id SERIAL PRIMARY KEY,
            sender_id VARCHAR(255) NOT NULL,
            receiver_id VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            read_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Add rates table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS crypto_rates (
            id SERIAL PRIMARY KEY,
            crypto VARCHAR(10) UNIQUE NOT NULL,
            buy_rate DECIMAL(15,2) NOT NULL,
            sell_rate DECIMAL(15,2) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT true
          );
        `);
        
        // Insert default rates
        await pool.query(`
          INSERT INTO crypto_rates (crypto, buy_rate, sell_rate) VALUES
          ('BTC', 45250000, 44750000),
          ('ETH', 2850000, 2820000),
          ('USDT', 1580, 1570)
          ON CONFLICT (crypto) DO NOTHING;
        `);
        
        console.log('Chat and rates tables created successfully!');
      } catch (error) {
        console.log('Tables already exist or error:', error.message);
      }
      await pool.end();
    } catch (error) {
      console.log('Database already exists or error:', error.message);
    }
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'https://bpay-app-frontend.vercel.app', 'https://bpay-app.vercel.app', 'https://bpayapp.netlify.app', 'https://bpay-app.netlify.app', 'https://bpayapp.co.ke', 'https://www.bpayapp.co.ke'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/avatar', require('./routes/avatar'));
app.use('/api/adminAuth', require('./routes/adminAuth'));
app.use('/api/deposit', require('./routes/deposit'));
app.use('/api/price-alerts', require('./routes/priceAlerts'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/withdrawals', require('./routes/withdrawals'));
app.use('/api/system', require('./routes/system-health'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin-assignment'));
app.use('/api/admin-decisions', require('./routes/admin-decisions'));
app.use('/api/rates', require('./routes/rates'));
app.use('/api/email', require('./routes/email'));
app.use('/api/sasapay-test', require('./routes/sasapay-test'));
app.use('/api/sasapay', require('./routes/sasapay'));
app.use('/api/luno', require('./routes/luno'));
app.use('/api/auto-email', require('./routes/auto-email'));
app.use('/api/demo', require('./routes/demo'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = http.createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

server.listen(PORT, async () => {
  console.log('\n🚀 ========================================');
  console.log(`🚀 BPay API Server Started`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🚀 WebSocket: Enabled`);
  console.log('🚀 ========================================\n');
  
  await initDatabase();
  
  console.log('\n✅ Server ready to accept requests\n');
});