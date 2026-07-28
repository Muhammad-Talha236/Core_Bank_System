const { Pool } = require('pg');

// Neon requires SSL. Neon gives you a single connection string
// (DATABASE_URL) rather than separate host/user/pass/db like MySQL.
// Falls back to discrete vars if DATABASE_URL isn't set, so local
// Postgres dev still works without Neon.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // required for Neon
    })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432
    });

pool.on('error', (err) => {
  // Idle client errors (e.g. Neon closing an idle connection) shouldn't
  // crash the whole app — log and let the pool recover.
  console.error('Unexpected error on idle Postgres client:', err.message);
});

// Startup health check so connection failures are obvious immediately
// instead of surfacing as a confusing error on the first request.
async function verifyConnection() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    console.log(`✅ Postgres connected — DB: ${rows[0].db}, server time: ${rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ Postgres connection failed:', err.message);
    console.error('   Check DATABASE_URL / DB_HOST-DB_USER-DB_PASS-DB_NAME in your .env file.');
    return false;
  }
}

module.exports = pool;
module.exports.verifyConnection = verifyConnection;
