const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Convert PostgreSQL $1,$2 placeholders to SQLite ? placeholders
function convertSql(sql) {
  return sql.replace(/\$\d+/g, '?');
}

// Mimic pg's pool.query({ rows, rowCount }) interface
async function query(sql, params = []) {
  const converted = convertSql(sql);
  const result = await client.execute({ sql: converted, args: params });
  return {
    rows: result.rows.map(row => {
      // libsql returns rows as array-like objects — convert to plain objects
      const obj = {};
      result.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    }),
    rowCount: result.rowsAffected,
  };
}

// pg Pool shim — routes that do `new Pool(...)` get this same client
class Pool {
  constructor() {} // ignore connection string — we use env vars
  query(sql, params) { return query(sql, params); }
  end() { return Promise.resolve(); }
  on() {} // ignore pool events
}

module.exports = { query, Pool, pool: { query, end: () => Promise.resolve(), on: () => {} } };
// Also export as default function for routes that do: const pool = require('../config/db')
module.exports.default = { query, end: () => Promise.resolve(), on: () => {} };

// Make require('../config/db').query work AND require('../config/db') work as pool object
const poolProxy = new Proxy(module.exports, {
  get(target, prop) {
    if (prop === 'query') return query;
    if (prop === 'Pool') return Pool;
    if (prop === 'end') return () => Promise.resolve();
    if (prop === 'on') return () => {};
    return target[prop];
  },
  apply(target, thisArg, args) {
    return query(...args);
  }
});

module.exports = poolProxy;
