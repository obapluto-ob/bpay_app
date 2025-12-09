# BPay Database Setup Guide

## Overview
This guide helps you set up the complete BPay database with all required tables and unique 9-digit order IDs.

## What This Setup Does

### 1. **Unique 9-Digit Order IDs**
- Every trade gets a unique 9-digit order ID (e.g., `#123456789`)
- Easy to read and communicate
- Perfect for tracking bank transfers and payments
- Displayed prominently in admin dashboard

### 2. **Creates Missing Tables**
- ✅ `admins` - Admin users with roles and performance metrics
- ✅ `deposits` - User deposit records
- ✅ `chat_messages` - User-admin trade chat
- ✅ `admin_chat_messages` - Admin-to-admin communication
- ✅ `disputes` - Dispute management system

### 3. **Adds Missing Columns**
- User balance columns: `btc_balance`, `eth_balance`, `usdt_balance`, `ngn_balance`, `kes_balance`
- Trade columns: `order_id`, `assigned_admin`, `rating`, `rating_comment`, `rated`

## Quick Setup

### Option 1: Run Setup Script (Recommended)
```bash
cd backend
node setup-database.js
```

This will:
- Create all missing tables
- Add order_id column to trades
- Generate unique 9-digit IDs for existing trades
- Verify everything is set up correctly

### Option 2: Manual SQL Execution
```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i src/database/migration_add_order_id.sql
```

## Verify Setup

After running the setup, verify:

1. **Check Tables Exist**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

2. **Check Order IDs**
```sql
SELECT id, order_id, type, crypto, fiat_amount, status 
FROM trades 
LIMIT 5;
```

3. **Check Admins**
```sql
SELECT id, name, email, role FROM admins;
```

## Order ID System

### How It Works
- **Format**: 9 digits (e.g., `123456789`)
- **Range**: 100000000 to 999999999
- **Uniqueness**: Enforced by database constraint
- **Generation**: Automatic on trade creation

### Example Usage
```javascript
// Backend automatically generates order_id
const trade = await createTrade({
  type: 'buy',
  crypto: 'BTC',
  fiatAmount: 50000,
  // order_id is auto-generated: "234567890"
});

// Display in admin dashboard
console.log(`Order #${trade.order_id}`); // Order #234567890
```

### Benefits
1. **Easy Communication**: "Please send payment for order #234567890"
2. **Bank Reference**: Users can use order ID as transfer reference
3. **Quick Lookup**: Admins can search by order ID
4. **Professional**: Looks clean and organized

## Admin Dashboard Display

The admin dashboard now shows:
- **Prominent Order IDs**: Large, bold, orange text
- **Clickable Rows**: Click any order to view details and chat
- **User Information**: Name and email for each order
- **Status Badges**: Visual status indicators

## Troubleshooting

### Issue: "column order_id does not exist"
**Solution**: Run the migration script
```bash
node setup-database.js
```

### Issue: "table admins does not exist"
**Solution**: The migration creates all missing tables automatically

### Issue: Duplicate order IDs
**Solution**: The system uses UNIQUE constraint and random generation to prevent duplicates. If you see duplicates, run:
```sql
UPDATE trades SET order_id = LPAD(FLOOR(100000000 + RANDOM() * 900000000)::TEXT, 9, '0');
```

## Production Deployment

### Render Database Setup
1. Go to your Render dashboard
2. Open your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Run the setup script:
```bash
DATABASE_URL="your-render-database-url" node setup-database.js
```

### Verify on Render
1. Check Render logs for migration success
2. Test creating a new trade via API
3. Verify order_id appears in response
4. Check admin dashboard displays order IDs

## Sample Data

After setup, you can add sample data:

```sql
-- Sample admin (password: admin123)
INSERT INTO admins (name, email, password, role) 
VALUES ('John Admin', 'john@bpay.com', '$2b$10$rKvVLZ8xqJ5xJ5xJ5xJ5xOqJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5xJ5x', 'trade_admin');

-- Sample trade with order_id
INSERT INTO trades (user_id, type, crypto, fiat_amount, crypto_amount, country, status, order_id)
VALUES ('user_123', 'buy', 'BTC', 50000, 0.0005, 'NG', 'pending', '123456789');
```

## Next Steps

1. ✅ Run database setup
2. ✅ Deploy backend to Render
3. ✅ Test order creation
4. ✅ Verify admin dashboard shows order IDs
5. ✅ Train admins on new order ID system

## Support

If you encounter issues:
1. Check Render logs for errors
2. Verify DATABASE_URL is correct
3. Ensure PostgreSQL version is 12+
4. Run setup script again if needed

---

**BPay Database Setup** - Complete MVP system with all required tables and unique order tracking
