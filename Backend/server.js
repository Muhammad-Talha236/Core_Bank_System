require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const pool = require('./config/db');

const authRoutes = require('./routes/auth/auth.routes');
const employeeRoutes = require('./routes/superadmin/employee.routes');
const branchRoutes = require('./routes/superadmin/branch.routes');
const settingsRoutes = require('./routes/superadmin/settings.routes');
const customerRoutes = require('./routes/customer/customer.routes');
const accountRoutes = require('./routes/account/account.routes');
const transactionRoutes = require('./routes/transaction/transaction.routes');
const auditRoutes = require('./routes/audit/audit.routes');
const chatbotRoutes = require('./routes/chatbot/chatbot.routes');
// Customer self-service portal (separate from staff-facing routes above)
const customerAuthRoutes = require('./routes/customerPortal/customerAuth.routes');
const customerPortalRoutes = require('./routes/customerPortal/customerPortal.routes');

const app = express();
// In production, only allow requests from your deployed frontend.
// FRONTEND_URL is set as an env var on Render once the Vercel URL is known.
// Locally (no env var set), everything is allowed so dev stays easy.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(bodyParser.json());

// Staff-facing API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/chatbot', chatbotRoutes);
// Customer self-service portal routes
app.use('/api/customer-auth', customerAuthRoutes);
app.use('/api/customer-portal', customerPortalRoutes);

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
  await pool.verifyConnection();
});