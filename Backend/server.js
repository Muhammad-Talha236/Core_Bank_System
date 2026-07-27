require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const pool = require('./db/connection');
const customerRoutes = require('./routes/customer');
const accountRoutes = require('./routes/account');

const transactionRoutes = require('./routes/transaction');
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);


app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() as time');
    res.json({ ok: true, dbTime: rows[0].time });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`✅ CBS Backend (Neon test phase) running on http://localhost:${PORT}`);
  await pool.verifyConnection();
});