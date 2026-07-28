require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const pool = require('./db/connection');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const accountRoutes = require('./routes/account');
const transactionRoutes = require('./routes/transaction');
const auditRoutes = require('./routes/audit');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve frontend static files
app.use('/frontend', express.static(path.join(__dirname, '..', 'Frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit', auditRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as time, current_database() as db');
    res.json({ ok: true, database: rows[0].db, dbTime: rows[0].time });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`✅ CBS Backend running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/frontend/index.html`);
  await pool.verifyConnection();
});