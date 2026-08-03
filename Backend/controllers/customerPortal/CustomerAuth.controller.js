const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MAX_FAILED_ATTEMPTS = 5;
const TOKEN_EXPIRY = '2h'; // shorter than staff sessions - customer-facing, more sensitive

// POST /api/customer-auth/register
// A customer's bank account must already exist (opened in person by staff).
// To register for online banking, they prove identity with CNIC + AccountNo,
// then set a password. This mirrors how real banks onboard online banking users.
exports.register = async (req, res) => {
  const { cnic, accountNo, password } = req.body;

  if (!cnic || !accountNo || !password) {
    return res.status(400).json({ error: 'cnic, accountNo and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c."CustomerID", c."Name", c."RegisteredForOnlineBanking"
       FROM "Customer" c
       JOIN "Account" a ON c."CustomerID" = a."CustomerID"
       WHERE c."CNIC" = $1 AND a."AccountNo" = $2`,
      [cnic, accountNo]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CNIC and account number do not match our records' });
    }

    const customer = rows[0];

    if (customer.RegisteredForOnlineBanking) {
      return res.status(400).json({ error: 'This customer is already registered for online banking. Please log in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE "Customer"
       SET "PasswordHash" = $1, "RegisteredForOnlineBanking" = TRUE
       WHERE "CustomerID" = $2`,
      [passwordHash, customer.CustomerID]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('INSERT', 'Customer', $1, $2, 'Registered for online banking')`,
      [customer.CustomerID, customer.Name]
    );

    res.json({ success: true, message: 'Registration successful. You can now log in.' });
  } catch (error) {
    console.error('Customer registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/customer-auth/login
exports.login = async (req, res) => {
  const { gmail, cnic, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if ((!gmail && !cnic) || !password) {
    return res.status(400).json({ error: 'gmail or cnic, plus password, are required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT "CustomerID", "Name", "Gmail", "CNIC", "PasswordHash", "Status", "FailedLoginAttempts", "RegisteredForOnlineBanking"
       FROM "Customer"
       WHERE ${gmail ? '"Gmail" = $1' : '"CNIC" = $1'}`,
      [gmail || cnic]
    );

    if (rows.length === 0 || !rows[0].RegisteredForOnlineBanking) {
      return res.status(401).json({ error: 'Invalid credentials or not registered for online banking' });
    }

    const customer = rows[0];

    if (customer.Status === 'Locked') {
      return res.status(403).json({ error: 'Account locked due to too many failed attempts. Please contact your branch.' });
    }
    if (customer.Status === 'Suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact your branch.' });
    }

    const passwordMatches = await bcrypt.compare(password, customer.PasswordHash);

    if (!passwordMatches) {
      const newAttempts = customer.FailedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

      await pool.query(
        `UPDATE "Customer" SET "FailedLoginAttempts" = $1, "Status" = $2 WHERE "CustomerID" = $3`,
        [newAttempts, shouldLock ? 'Locked' : customer.Status, customer.CustomerID]
      );

      if (shouldLock) {
        return res.status(403).json({ error: 'Too many failed attempts. Your account has been locked.' });
      }
      return res.status(401).json({
        error: `Invalid credentials. ${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining before lockout.`
      });
    }

    await pool.query(
      `UPDATE "Customer" SET "FailedLoginAttempts" = 0, "LastLogin" = NOW() WHERE "CustomerID" = $1`,
      [customer.CustomerID]
    );

    const token = jwt.sign(
      { type: 'customer', customerId: customer.CustomerID, name: customer.Name },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({
      success: true,
      token,
      customer: { customerId: customer.CustomerID, name: customer.Name, gmail: customer.Gmail }
    });
  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/customer-auth/me
exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT "CustomerID", "Name", "CNIC", "Contact", "Gmail", "LastLogin" FROM "Customer" WHERE "CustomerID" = $1`,
      [req.customer.customerId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/customer-auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT "PasswordHash" FROM "Customer" WHERE "CustomerID" = $1`,
      [req.customer.customerId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const matches = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE "Customer" SET "PasswordHash" = $1 WHERE "CustomerID" = $2`, [newHash, req.customer.customerId]);

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('UPDATE', 'Customer', $1, $2, 'Password changed by customer (self-service)')`,
      [req.customer.customerId, req.customer.name]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Customer change password error:', error);
    res.status(500).json({ error: error.message });
  }
};