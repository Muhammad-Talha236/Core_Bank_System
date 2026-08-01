const pool = require('../../config/db');
const crypto = require('crypto');

const SYSTEM_WIDE_ROLES = ['SuperAdmin', 'Auditor'];

function generateAccountNumber() {
  try {
    return crypto.randomInt(10000000, 100000000);
  } catch (e) {
    return Math.floor(Math.random() * 90000000) + 10000000;
  }
}

exports.getAllAccounts = async (req, res) => {
  try {
    const isSystemWide = SYSTEM_WIDE_ROLES.includes(req.employee.roleName);

    const query = `
      SELECT
        a."AccountNo",
        a."CustomerID" AS "CustID",
        c."Name" AS "CustomerName",
        a."Type",
        a."Nickname",
        a."ProductID",
        a."Balance",
        a."Status",
        a."BranchID",
        b."BranchName",
        td."MaturityDate",
        td."InterestRate" AS "TermDepositRate"
      FROM "Account" a
      JOIN "Customer" c ON a."CustomerID" = c."CustomerID"
      LEFT JOIN "Branch" b ON a."BranchID" = b."BranchID"
      LEFT JOIN "TermDeposit" td ON a."AccountNo" = td."AccountNo"
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

exports.checkCustomerAccount = async (req, res) => {
  try {
    const isSystemWide = SYSTEM_WIDE_ROLES.includes(req.employee.roleName);
    const query = isSystemWide
      ? `SELECT "AccountNo" FROM "Account" WHERE "CustomerID" = $1`
      : `SELECT "AccountNo" FROM "Account" WHERE "CustomerID" = $1 AND "BranchID" = $2`;
    const params = isSystemWide ? [req.params.customerId] : [req.params.customerId, req.employee.branchId];
    const { rows } = await pool.query(query, params);
    res.json({ hasAccount: rows.length > 0, accounts: rows });
  } catch (error) {
    console.error('Error checking account:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new account. Supports Savings, Current, and TermDeposit.
// A productId from the AccountProduct catalog is required - this drives
// the account's Nickname, interest rate, and (for TermDeposit) its term/maturity.
exports.createAccount = async (req, res) => {
  const { custID, productId, balance, branchId } = req.body;

  if (!custID || !productId) {
    return res.status(400).json({ error: 'custID and productId are required' });
  }

  const initialBalance = parseFloat(balance) || 0;
  if (initialBalance < 0) {
    return res.status(400).json({ error: 'Initial balance cannot be negative' });
  }

  const targetBranchId = req.employee.roleName === 'SuperAdmin'
    ? (branchId || req.employee.branchId)
    : req.employee.branchId;

  if (!targetBranchId) {
    return res.status(400).json({ error: 'No branch assigned - cannot create account' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: productRows } = await client.query(
      `SELECT * FROM "AccountProduct" WHERE "ProductID" = $1 AND "IsActive" = TRUE`,
      [productId]
    );
    if (productRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or inactive product selected' });
    }
    const product = productRows[0];
    const accountType = product.AccountType;

    if (accountType === 'TermDeposit' && initialBalance <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Term deposits require a positive initial deposit amount' });
    }

    let accountNo;
    let inserted = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts && !inserted) {
      accountNo = generateAccountNumber();
      await client.query('SAVEPOINT before_account_insert');
      try {
        await client.query(
          `INSERT INTO "Account" ("AccountNo", "CustomerID", "Type", "Balance", "Status", "BranchID", "Nickname", "ProductID")
           VALUES ($1, $2, $3, $4, 'Active', $5, $6, $7)`,
          [accountNo, custID, accountType, initialBalance, targetBranchId, product.ProductName, product.ProductID]
        );
        await client.query('RELEASE SAVEPOINT before_account_insert');
        inserted = true;
      } catch (err) {
        await client.query('ROLLBACK TO SAVEPOINT before_account_insert');
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
        `INSERT INTO "SavingAccount" ("AccountNo", "InterestRate") VALUES ($1, $2)`,
        [accountNo, product.InterestRate]
      );
    } else if (accountType === 'Current') {
      await client.query(
        `INSERT INTO "CurrentAccount" ("AccountNo", "OverdraftLimit") VALUES ($1, 5000.00)`,
        [accountNo]
      );
    } else if (accountType === 'TermDeposit') {
      const { rows: dateRows } = await client.query(
        `SELECT (CURRENT_DATE + ($1 || ' months')::INTERVAL)::DATE AS "MaturityDate"`,
        [product.TermMonths]
      );
      await client.query(
        `INSERT INTO "TermDeposit" ("AccountNo", "TermMonths", "InterestRate", "MaturityDate", "PenaltyRate")
         VALUES ($1, $2, $3, $4, 2.00)`,
        [accountNo, product.TermMonths, product.InterestRate, dateRows[0].MaturityDate]
      );
    }

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('INSERT', 'Account', $1, $2, $3)`,
      [accountNo, req.employee.name, `${product.ProductName} opened for customer ${custID}, balance: ${initialBalance}`]
    );

    await client.query('COMMIT');

    res.json({ success: true, accountNo, product: product.ProductName, message: 'Account created successfully' });
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

// Close a Term Deposit - either at/after maturity (full payout) or early
// (principal minus penalty). Proceeds go to another one of the customer's accounts.
exports.closeTermDeposit = async (req, res) => {
  const { accountNo } = req.params;
  const { targetAccountNo } = req.body;

  if (!targetAccountNo) {
    return res.status(400).json({ error: 'targetAccountNo (where to deposit proceeds) is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: tdRows } = await client.query(
      `SELECT td.*, a."Balance", a."CustomerID"
       FROM "TermDeposit" td JOIN "Account" a ON td."AccountNo" = a."AccountNo"
       WHERE td."AccountNo" = $1 AND td."Status" = 'Active' FOR UPDATE`,
      [accountNo]
    );

    if (tdRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Active term deposit not found' });
    }
    const td = tdRows[0];

    const { rows: targetRows } = await client.query(
      `SELECT "Balance", "CustomerID" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`,
      [targetAccountNo]
    );
    if (targetRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Target account not found' });
    }
    if (targetRows[0].CustomerID !== td.CustomerID) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Target account must belong to the same customer' });
    }

    const principal = parseFloat(td.Balance);
    const today = new Date();
    const maturityDate = new Date(td.MaturityDate);
    const isMatured = today >= maturityDate;

    let payout, statusNote;
    if (isMatured) {
      const interest = principal * (parseFloat(td.InterestRate) / 100) * (td.TermMonths / 12);
      payout = principal + interest;
      statusNote = `Matured payout: principal ${principal} + interest ${interest.toFixed(2)}`;
    } else {
      const penalty = principal * (parseFloat(td.PenaltyRate) / 100);
      payout = principal - penalty;
      statusNote = `Early closure: principal ${principal} - penalty ${penalty.toFixed(2)}`;
    }

    const newTargetBalance = parseFloat(targetRows[0].Balance) + payout;
    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [newTargetBalance, targetAccountNo]);
    await client.query(`UPDATE "Account" SET "Balance" = 0, "Status" = 'Closed' WHERE "AccountNo" = $1`, [accountNo]);
    await client.query(
      `UPDATE "TermDeposit" SET "Status" = $1 WHERE "AccountNo" = $2`,
      [isMatured ? 'Matured' : 'Closed', accountNo]
    );

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
       VALUES ($1, $2, $3, 'Transfer', 'Success', $4, $5, $6, 'Auto-Approved')
       RETURNING "TransID"`,
      [accountNo, targetAccountNo, payout, req.employee.name, `Term deposit closure: ${statusNote}`, req.employee.employeeId]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "LedgerEntry" ("TransID", "AccountNo", "EntryType", "Amount", "BalanceAfter") VALUES ($1, $2, 'DEBIT', $3, 0)`,
      [transId, accountNo, principal]
    );
    await client.query(
      `INSERT INTO "LedgerEntry" ("TransID", "AccountNo", "EntryType", "Amount", "BalanceAfter") VALUES ($1, $2, 'CREDIT', $3, $4)`,
      [transId, targetAccountNo, payout, newTargetBalance]
    );

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'TermDeposit', $1, $2, $3)`,
      [accountNo, req.employee.name, statusNote]
    );

    await client.query('COMMIT');
    res.json({ success: true, matured: isMatured, payout, newTargetBalance, message: statusNote });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error closing term deposit:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};