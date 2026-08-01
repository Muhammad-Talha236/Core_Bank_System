const pool = require('../../config/db');
const crypto = require('crypto');

// helper: 8-digit account number (10,000,000 .. 99,999,999)
function generateAccountNumber() {
  try {
    return crypto.randomInt(10000000, 100000000); // upper bound exclusive
  } catch (e) {
    return Math.floor(Math.random() * 90000000) + 10000000;
  }
}

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        "CustomerID" AS "CustID",
        "Name",
        "CNIC",
        "Contact",
        "Gmail"
      FROM "Customer"
      ORDER BY "CustomerID" DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add new customer (creates Account with 8-digit AccountNo)
exports.addCustomer = async (req, res) => {
  const { name, cnic, contact, gmail, Gmail } = req.body;
  const email = gmail ?? Gmail ?? null;

  if (!name || !cnic || !contact || !email) {
    return res.status(400).json({ error: 'name, cnic, contact and gmail are all required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const custResult = await client.query(
      `INSERT INTO "Customer" ("Name", "CNIC", "Contact", "Gmail")
       VALUES ($1, $2, $3, $4)
       RETURNING "CustomerID"`,
      [name, cnic, contact, email]
    );
    const customerId = custResult.rows[0].CustomerID;

    // generate unique 8-digit account number (retry on collision)
    let accountNo;
    const maxAttempts = 5;
    let attempts = 0;
    let inserted = false;

    // SAVEPOINT so a failed insert attempt only undoes itself, not the
    // whole transaction (Postgres aborts the full transaction on error,
    // unlike MySQL) - lets the retry loop actually work.
    while (attempts < maxAttempts && !inserted) {
      accountNo = generateAccountNumber();
      await client.query('SAVEPOINT before_account_insert');
      try {
        await client.query(
          `INSERT INTO "Account" ("AccountNo", "CustomerID", "Type", "Balance", "Status", "Nickname")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [accountNo, customerId, 'Savings', 0.00, 'Active', 'Primary Savings']
        );
        await client.query('RELEASE SAVEPOINT before_account_insert');
        inserted = true;
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT before_account_insert');
        if (err.code === '23505') { // unique_violation
          attempts++;
          continue;
        }
        throw err;
      }
    }

    if (!inserted) {
      throw new Error('Failed to generate unique account number after multiple attempts');
    }

    await client.query(
      `INSERT INTO "SavingAccount" ("AccountNo", "InterestRate") VALUES ($1, $2)`,
      [accountNo, 3.50]
    );

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ($1, $2, $3, $4, $5)`,
      ['INSERT', 'Account', accountNo, name, `Account created for customer ${customerId}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      customerId,
      accountNo,
      message: 'Customer and account created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding customer:', error);

    if (error.code === '23505') {
      const constraintName = (error.constraint || '').toLowerCase();
      if (constraintName.includes('cnic')) {
        return res.status(400).json({ error: 'Customer with this CNIC already exists' });
      }
      if (constraintName.includes('gmail')) {
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
      return res.status(400).json({ error: 'Duplicate entry found' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};