const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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
        // Try to add it anyway
        try {
          await pool.query('ALTER TABLE users ADD COLUMN avatar TEXT;');
          console.log('Avatar column added on retry!');
        } catch (retryError) {
          console.log('Avatar column retry failed:', retryError.message);
        }
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
  origin: ['http://localhost:3000', 'https://bpay-app-frontend.vercel.app', 'https://bpay-app.vercel.app', 'https://bpayapp.netlify.app', 'https://bpay-app.netlify.app'],
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trade', require('./routes/trade'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/avatar', require('./routes/avatar'));
app.use('/api/admin/auth', require('./routes/adminAuth'));
app.use('/api/deposit', require('./routes/deposit'));

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

app.listen(PORT, async () => {
  console.log(`BPay API server running on port ${PORT}`);
  await initDatabase();
});