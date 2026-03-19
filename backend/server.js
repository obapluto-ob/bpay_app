const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const http = require('http');
require('dotenv').config();
const websocketService = require('./src/services/websocket');

// ── Turso pg shim ──────────────────────────────────────────────────────────
// Patch require('pg') BEFORE any routes load so every route that does
// `const { Pool } = require('pg')` gets the Turso client instead.
const db = require('./config/db');
const Module = require('module');
const dbAbsolutePath = require.resolve('./config/db');
const _resolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === 'pg') return dbAbsolutePath;
  return _resolveFilename(request, parent, isMain, options);
};
require.cache[dbAbsolutePath] = require.cache[dbAbsolutePath] || {};
require.cache[dbAbsolutePath].exports = { Pool: db.Pool, ...db };
// ───────────────────────────────────────────────────────────────────────────

const pool = db;

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Auto-migrate database on startup — runs on every environment
async function initDatabase() {
  try {
    console.log('Initializing Turso database...');
    const schemaPath = path.join(__dirname, 'src/database/simple_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Split on semicolons and run each statement individually (libsql requirement)
      const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
      for (const stmt of statements) {
        try { await pool.query(stmt); } catch (e) { /* ignore already-exists errors */ }
      }
      console.log('✅ Turso schema initialized');
    }
  } catch (error) {
    console.log('⚠️ Database init error:', error.message);
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:7357', 'https://bpay-app-frontend.vercel.app', 'https://bpay-app.vercel.app', 'https://bpayapp.netlify.app', 'https://bpay-app.netlify.app', 'https://bpayapp.co.ke', 'https://www.bpayapp.co.ke'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Reduced from 500
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '5mb' })); // Reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/live-rates', require('./routes/live-rates'));
app.use('/api/debug', require('./routes/debug'));
app.use('/api/test-db', require('./routes/test-db'));
app.use('/api/public', require('./routes/public-rates'));
app.use('/api/auth', require('./routes/auth-fixed'));
app.use('/api/auth', require('./routes/google-auth'));
app.use('/api/trade', require('./routes/trade-fixed'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/avatar', require('./routes/avatar'));
app.use('/api/adminAuth', require('./routes/admin-auth'));
app.use('/api/adminChat', require('./routes/admin-chat-routes'));
app.use('/api/withdraw', require('./routes/withdraw'));
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
app.use('/api/logos', require('./routes/crypto-logos'));
app.use('/api/auto-email', require('./routes/auto-email'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/test', require('./routes/test-routes'));
app.use('/api/quick', require('./routes/quick-setup'));
app.use('/api/email-test', require('./routes/email-test'));
app.use('/api/external', require('./routes/external-apis'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/crypto', require('./routes/crypto'));
app.use('/api/fix', require('./routes/fix-old-users'));
app.use('/api/migrate', require('./routes/migrate-db'));
app.use('/api/admin-verify', require('./routes/admin-verify'));
app.use('/api/admin-rates', require('./routes/admin-rates'));

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
  console.log(`🚀 Database: Turso ${process.env.TURSO_DATABASE_URL ? '✅' : '❌ TURSO_DATABASE_URL missing'}`);
  console.log(`🚀 WebSocket: Enabled`);
  console.log('🚀 ========================================\n');
  
  await initDatabase();
  
  console.log('\n✅ Server ready to accept requests\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close WebSocket
    websocketService.shutdown();
    
    pool.end();
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});