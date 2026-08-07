const { Pool } = require('pg');

const masterPool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432
    });

const replicaPool = process.env.READ_DATABASE_URL
  ? new Pool({
      connectionString: process.env.READ_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : masterPool;

[masterPool, replicaPool].forEach((p) => {
  p.options.idleTimeoutMillis = 10000;
  p.options.max = 20;
});

masterPool.on('error', (err) => {
  console.error('Unexpected error on master Postgres client:', err.message);
});

replicaPool.on('error', (err) => {
  console.error('Unexpected error on replica Postgres client:', err.message);
});

async function queryMaster(text, params) {
  const client = await masterPool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function queryReplica(text, params) {
  const client = await replicaPool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function verifyConnection() {
  try {
    const client = await masterPool.connect();
    const { rows } = await client.query('SELECT NOW() as now, current_database() as db');
    client.release();
    console.log(`  Postgres Master connected   DB: ${rows[0].db}, server time: ${rows[0].now}`);
    return true;
  } catch (err) {
    console.error('  Postgres connection failed:', err.message);
    return false;
  }
}

// Attach helper properties directly to masterPool so existing 'const pool = require(...)'-based calls work seamlessly
masterPool.replicaPool = replicaPool;
masterPool.queryMaster = queryMaster;
masterPool.queryReplica = queryReplica;
masterPool.verifyConnection = verifyConnection;

module.exports = masterPool;