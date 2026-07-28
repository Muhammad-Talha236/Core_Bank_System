const pool = require('../../config/db');
const crypto = require('crypto');

// Roles that can see every branch's data (system-wide access)
const SYSTEM_WIDE_ROLES = ['SuperAdmin', 'Auditor'];

function generateAccountNumber() {
  try {
    return crypto.randomInt(10000000, 100000000); // 8-digit, upper bound exclusive
  } catch (e) {
    return Math.floor(Math.random() * 90000000) + 10000000;
  }
}

// Get all accounts - branch-scoped unless the caller has system-wide access
exports.getAllAccounts = async (req, res) => {
  try {
    const isSystemWide = SYSTEM_WIDE_ROLES.includes(req.employee.roleName);

    const query = `
      SELECT
        a."AccountNo",
        a."CustomerID" AS "CustID",
        c."Name" AS "CustomerName",
        a."Type",
        a."Balance",
        a."Status",
        a."BranchID",
        b."BranchName"
      FROM "Account" a
      JOIN "Customer" c ON a."CustomerID" = c."CustomerID"
      LEFT JOIN "Branch" b ON a."BranchID" = b."BranchID"
      ${isSystemWide ? '' : 'WHERE a."BranchID" = $1'}
      ORDER BY a."AccountNo" DESC
    `;

    const { rows } = isSystemWide
      ? await pool.query(query)
      : await pool.query(query, [req.employee.branchId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Check if a customer already has an account (branch-scoped same as above)
exports.checkCustomerAccount = async (req, res) => {
  try {
    const isSystemWide = SYSTEM_WIDE_ROLES.includes(req.employee.roleName);

    const query = isSystemWide
      ? `SELECT "AccountNo" FROM "Account" WHERE "CustomerID" = $1`
      : `SELECT "AccountNo" FROM "Account" WHERE "CustomerID" = $1 AND "BranchID" = $2`;

    const params = isSystemWide
      ? [req.params.customerId]
      : [req.params.customerId, req.employee.branchId];

    const { rows } = await pool.query(query, params);
    res.json({ hasAccount: rows.length > 0, accounts: rows });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new account for an existing customer
// The account is automatically assigned to the logged-in employee's branch,
// UNLESS the employee is SuperAdmin, in which case they may specify any branchId.
exports.createAccount = async (req, res) => {
  const { custID, type, balance, branchId } = req.body;

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

  // Non-SuperAdmins always create accounts at their own branch, no exceptions
  const targetBranchId = req.employee.roleName === 'SuperAdmin'
    ? (branchId || req.employee.branchId)
    : req.employee.branchId;

  if (!targetBranchId) {
    return res.status(400).json({ error: 'No branch assigned - cannot create account' });
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
          `INSERT INTO "Account" ("AccountNo", "CustomerID", "Type", "Balance", "Status", "BranchID")
           VALUES ($1, $2, $3, $4, 'Active', $5)`,
          [accountNo, custID, accountType, initialBalance, targetBranchId]
        );
        inserted = true;
      } catch (err) {
        if (err.code === '23505') {
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
      ['INSERT', 'Account', accountNo, req.employee.name, `Account created for customer ${custID} at branch ${targetBranchId}, balance: ${initialBalance}`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      accountNo,
      branchId: targetBranchId,
      message: 'Account created successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating account:', error);

    if (error.code === '23503') {
      return res.status(400).json({ error: 'Customer or branch with this ID does not exist' });
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};