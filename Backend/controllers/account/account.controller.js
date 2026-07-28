const pool = require('../../config/db');
const crypto = require('crypto');

function generateAccountNumber() {
  try {
    return crypto.randomInt(10000000, 100000000); // 8-digit, upper bound exclusive
  } catch (e) {
    return Math.floor(Math.random() * 90000000) + 10000000;
  }
}

// Get all accounts (with customer name attached)
exports.getAllAccounts = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        a."AccountNo",
        a."CustomerID" AS "CustID",
        c."Name" AS "CustomerName",
        a."Type",
        a."Balance",
        a."Status"
      FROM "Account" a
      JOIN "Customer" c ON a."CustomerID" = c."CustomerID"
      ORDER BY a."AccountNo" DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check if a customer already has an account
exports.checkCustomerAccount = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT "AccountNo" FROM "Account" WHERE "CustomerID" = $1`,
      [req.params.customerId]
    );
    res.json({ hasAccount: rows.length > 0, accounts: rows });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new account for an existing customer
exports.createAccount = async (req, res) => {
  const { custID, type, balance } = req.body;

  if (!custID || !type) {
    return res.status(400).json({ error: 'custID and type are required' });
  }

  const accountType = type === 'SAV' ? 'Savings' : type === 'CUR' ? 'Current' : type;
  if (accountType !== 'Savings' && accountType !== 'Current') {
    return res.status(400).json({ error: 'type must be SAV, CUR, Savings, or Current' });
  }

  const initialBalance = parseFloat(balance) || 0;
  if (initialBalance < 0) {
    return res.status(400).json({ error: 'Initial balance cannot be negative' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let accountNo;
    let inserted = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !inserted) {
      accountNo = generateAccountNumber();
      try {
        await client.query(
          `INSERT INTO "Account" ("AccountNo", "CustomerID", "Type", "Balance", "Status")
           VALUES ($1, $2, $3, $4, 'Active')`,
          [accountNo, custID, accountType, initialBalance]
        );
        inserted = true;
      } catch (err) {
        if (err.code === '23505') { // unique_violation - retry with new number
          attempts++;
          continue;
        }
        throw err;
      }
    }

    if (!inserted) {
      throw new Error('Failed to generate unique account number after multiple attempts');
    }

    if (accountType === 'Savings') {
      await client.query(
        `INSERT INTO "SavingAccount" ("AccountNo", "InterestRate") VALUES ($1, 3.50)`,
        [accountNo]
      );
    } else {
      await client.query(
        `INSERT INTO "CurrentAccount" ("AccountNo", "OverdraftLimit") VALUES ($1, 5000.00)`,
        [accountNo]
      );
    }

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ($1, $2, $3, $4, $5)`,
      ['INSERT', 'Account', accountNo, 'system', `Account created for customer ${custID}, balance: ${initialBalance}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      accountNo,
      message: 'Account created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating account:', error);

    if (error.code === '23503') { // foreign_key_violation
      return res.status(400).json({ error: 'Customer with this ID does not exist' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
