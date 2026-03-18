// pg shim for Turso migration
// Every route that does: const { Pool } = require('pg'); const pool = new Pool({...})
// will get the Turso client instead — no changes needed in any route file.
const db = require('./config/db');
module.exports = { Pool: db.Pool };
