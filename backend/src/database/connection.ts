import { Pool } from 'pg';
import { mockQuery } from './mockDb';

// Use mock database if no DATABASE_URL is provided
let query: (text: string, params?: any[]) => Promise<any>;

if (!process.env.DATABASE_URL) {
  console.log('📝 Using mock database for testing');
  query = mockQuery;
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  query = (text: string, params?: any[]) => pool.query(text, params);
}

export { query };