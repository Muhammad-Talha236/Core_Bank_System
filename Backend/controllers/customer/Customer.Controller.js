const pool = require('../../config/db');
const crypto = require('crypto');

const SYSTEM_WIDE_ROLES = ['SuperAdmin', 'Auditor'];

// helper: 8-digit account number (10,000,000 .. 99,999,999)
function generateAccountNumber() {
  try {
    return crypto.randomInt(10000000, 100000000); // upper bound exclusive
  } catch (e) {
    return Math.floor(Math.random() * 90000000) + 10000000;
  }
}

// Get all customers - scoped to the logged-in employee's branch, same as
// Accounts. SuperAdmin and Auditor see every branch's customers, along
// with which branch each one belongs to (BranchName).
exports.getAllCustomers = async (req, res) => {
  try {
    const isSystemWide = SYSTEM_WIDE_ROLES.includes(req.employee.roleName);

    const query = `
      SELECT
        c."CustomerID" AS "CustID",
        c."Name",
        c."CNIC",
        c."Contact",
        c."Gmail",
        c."BranchID",
        b."BranchName"
      FROM "Customer" c
      LEFT JOIN "Branch" b ON c."BranchID" = b."BranchID"
      ${isSystemWide ? '' : 'WHERE c."BranchID" = $1'}
      ORDER BY c."CustomerID" DESC
    `;

    const { rows } = isSystemWide
      ? await pool.query(query)
      : await pool.query(query, [req.employee.branchId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add new customer (creates Account with 8-digit AccountNo).
// The customer is tied to the creating employee's branch - SuperAdmin can
// optionally target a different branch via req.body.branchId, same rule
// account.Controller.js already follows for account creation.
exports.addCustomer = async (req, res) => {
  const { name, cnic, contact, gmail, Gmail, branchId } = req.body;
  const email = gmail ?? Gmail ?? null;

  if (!name || !cnic || !contact || !email) {
    return res.status(400).json({ error: 'name, cnic, contact and gmail are all required' });
  }

  const targetBranchId = req.employee.roleName === 'SuperAdmin'
    ? (branchId || req.employee.branchId)
    : req.employee.branchId;

  if (!targetBranchId) {
    return res.status(400).json({ error: 'No branch assigned - cannot create customer' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const custResult = await client.query(
      `INSERT INTO "Customer" ("Name", "CNIC", "Contact", "Gmail", "BranchID")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "CustomerID"`,
      [name, cnic, contact, email, targetBranchId]
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
          `INSERT INTO "Account" ("AccountNo", "CustomerID", "Type", "Balance", "Status", "Nickname", "BranchID")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [accountNo, customerId, 'Savings', 0.00, 'Active', 'Primary Savings', targetBranchId]
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
  `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "EmployeeID", "Details")
   VALUES ($1, $2, $3, $4, $5, $6)`,
  ['INSERT', 'Account', accountNo, name, req.employee.employeeId, `Account created for customer ${customerId}`]
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