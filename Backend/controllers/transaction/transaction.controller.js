const pool = require('../../config/db');

// Transactions above this amount require approval from Admin/BranchManager/SuperAdmin
// before the money actually moves. Below this, they execute immediately (Auto-Approved).
const APPROVAL_THRESHOLD = 100000;

// Roles allowed to approve/reject pending transactions
const APPROVER_ROLES = ['SuperAdmin', 'Admin', 'BranchManager'];

async function getCustomerNameForAccount(client, accountNo) {
  const { rows } = await client.query(
    `SELECT c."Name" FROM "Customer" c
     JOIN "Account" a ON c."CustomerID" = a."CustomerID"
     WHERE a."AccountNo" = $1`,
    [accountNo]
  );
  return rows.length > 0 ? rows[0].Name : 'Unknown';
}

async function writeLedgerEntry(client, { transId, accountNo, entryType, amount, balanceAfter }) {
  await client.query(
    `INSERT INTO "LedgerEntry" ("TransID", "AccountNo", "EntryType", "Amount", "BalanceAfter")
     VALUES ($1, $2, $3, $4, $5)`,
    [transId, accountNo, entryType, amount, balanceAfter]
  );
}

// ---------- DEPOSIT ----------
exports.deposit = async (req, res) => {
  const { accountNo, amount, user } = req.body;
  const username = user || req.employee.name;
  const method = 'Cash';

  if (!accountNo || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
  }

  const requiresApproval = amount > APPROVAL_THRESHOLD && req.employee.roleName !== 'SuperAdmin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: accRows } = await client.query(
      `SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`,
      [accountNo]
    );
    if (accRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Account not found' });
    }

    if (requiresApproval) {
      // Log the request only. No balance change, no ledger entry yet.
      const { rows: transRows } = await client.query(
        `INSERT INTO "TransactionLog" ("ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
         VALUES ($1, $2, 'Deposit', 'Success', $3, $4, $5, 'Pending')
         RETURNING "TransID"`,
        [accountNo, amount, username, `Cash deposit of ${amount} (pending approval)`, req.employee.employeeId]
      );
      await client.query('COMMIT');
      return res.json({
        success: true,
        pending: true,
        transId: transRows[0].TransID,
        message: `Deposit of ${amount} exceeds ${APPROVAL_THRESHOLD} and requires approval before it is processed.`
      });
    }

    const currentBalance = parseFloat(accRows[0].Balance);
    const newBalance = currentBalance + parseFloat(amount);

    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [newBalance, accountNo]);

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
       VALUES ($1, $2, 'Deposit', 'Success', $3, $4, $5, 'Auto-Approved')
       RETURNING "TransID"`,
      [accountNo, amount, username, `Cash deposit of ${amount}`, req.employee.employeeId]
    );
    const transId = transRows[0].TransID;

    await client.query(`INSERT INTO "Deposit" ("TransID", "Amount", "DepositMethod") VALUES ($1, $2, $3)`, [transId, amount, method]);
    await writeLedgerEntry(client, { transId, accountNo, entryType: 'CREDIT', amount, balanceAfter: newBalance });
    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details") VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [accountNo, username, `Deposit of ${amount} successful`]
    );

    await client.query('COMMIT');
    const customerName = await getCustomerNameForAccount(client, accountNo);

    res.json({ success: true, message: 'Deposit successful', receiver: { accountNo, name: customerName, newBalance } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Deposit error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// ---------- WITHDRAW ----------
exports.withdraw = async (req, res) => {
  const { accountNo, amount, user } = req.body;
  const username = user || req.employee.name;
  const method = 'Counter';

  if (!accountNo || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
  }

  const requiresApproval = amount > APPROVAL_THRESHOLD && req.employee.roleName !== 'SuperAdmin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: accRows } = await client.query(
      `SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`,
      [accountNo]
    );
    if (accRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Account not found' });
    }

    const currentBalance = parseFloat(accRows[0].Balance);

    if (currentBalance < amount) {
      await client.query(
        `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
         VALUES ('ROLLBACK', 'Account', $1, $2, 'Insufficient balance')`,
        [accountNo, username]
      );
      await client.query('COMMIT');
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    if (requiresApproval) {
      const { rows: transRows } = await client.query(
        `INSERT INTO "TransactionLog" ("FromAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
         VALUES ($1, $2, 'Withdrawal', 'Success', $3, $4, $5, 'Pending')
         RETURNING "TransID"`,
        [accountNo, amount, username, `Counter withdrawal of ${amount} (pending approval)`, req.employee.employeeId]
      );
      await client.query('COMMIT');
      return res.json({
        success: true,
        pending: true,
        transId: transRows[0].TransID,
        message: `Withdrawal of ${amount} exceeds ${APPROVAL_THRESHOLD} and requires approval before it is processed.`
      });
    }

    const newBalance = currentBalance - parseFloat(amount);
    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [newBalance, accountNo]);

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
       VALUES ($1, $2, 'Withdrawal', 'Success', $3, $4, $5, 'Auto-Approved')
       RETURNING "TransID"`,
      [accountNo, amount, username, `Counter withdrawal of ${amount}`, req.employee.employeeId]
    );
    const transId = transRows[0].TransID;

    await client.query(`INSERT INTO "Withdrawal" ("TransID", "Amount", "WithdrawalMethod") VALUES ($1, $2, $3)`, [transId, amount, method]);
    await writeLedgerEntry(client, { transId, accountNo, entryType: 'DEBIT', amount, balanceAfter: newBalance });
    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details") VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [accountNo, username, `Withdrawal of ${amount} successful`]
    );

    await client.query('COMMIT');
    const customerName = await getCustomerNameForAccount(client, accountNo);

    res.json({ success: true, message: 'Withdrawal successful', sender: { accountNo, name: customerName, newBalance } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Withdraw error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// ---------- TRANSFER ----------
exports.transfer = async (req, res) => {
  let { fromAccount, toAccount, amount, user, accountNo } = req.body;
  const username = user || req.employee.name;

  if (!fromAccount && accountNo) fromAccount = accountNo;

  if (!fromAccount) return res.status(400).json({ success: false, error: 'Missing sender account' });
  if (!toAccount) return res.status(400).json({ success: false, error: 'Missing receiver account' });
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount entered' });
  }
  if (fromAccount == toAccount) {
    return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
  }

  const requiresApproval = amount > APPROVAL_THRESHOLD && req.employee.roleName !== 'SuperAdmin';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const [firstLock, secondLock] = fromAccount < toAccount ? [fromAccount, toAccount] : [toAccount, fromAccount];
    await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [firstLock]);
    await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [secondLock]);

    const { rows: fromRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [fromAccount]);
    const { rows: toRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [toAccount]);

    if (fromRows.length === 0 || toRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Sender or receiver account not found' });
    }

    const fromBalance = parseFloat(fromRows[0].Balance);
    const toBalance = parseFloat(toRows[0].Balance);

    if (fromBalance < amount) {
      await client.query(
        `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
         VALUES ('ROLLBACK', 'Account', $1, $2, 'Insufficient balance for transfer')`,
        [fromAccount, username]
      );
      await client.query('COMMIT');
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    if (requiresApproval) {
      const { rows: transRows } = await client.query(
        `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
         VALUES ($1, $2, $3, 'Transfer', 'Success', $4, $5, $6, 'Pending')
         RETURNING "TransID"`,
        [fromAccount, toAccount, amount, username, `Transfer of ${amount} from ${fromAccount} to ${toAccount} (pending approval)`, req.employee.employeeId]
      );
      await client.query('COMMIT');
      return res.json({
        success: true,
        pending: true,
        transId: transRows[0].TransID,
        message: `Transfer of ${amount} exceeds ${APPROVAL_THRESHOLD} and requires approval before it is processed.`
      });
    }

    const fromNewBalance = fromBalance - parseFloat(amount);
    const toNewBalance = toBalance + parseFloat(amount);

    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [fromNewBalance, fromAccount]);
    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [toNewBalance, toAccount]);

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedBy", "ApprovalStatus")
       VALUES ($1, $2, $3, 'Transfer', 'Success', $4, $5, $6, 'Auto-Approved')
       RETURNING "TransID"`,
      [fromAccount, toAccount, amount, username, `Transfer of ${amount} from ${fromAccount} to ${toAccount}`, req.employee.employeeId]
    );
    const transId = transRows[0].TransID;

    await client.query(`INSERT INTO "Transfer" ("TransID", "Amount", "TransferType") VALUES ($1, $2, 'Internal')`, [transId, amount]);
    await writeLedgerEntry(client, { transId, accountNo: fromAccount, entryType: 'DEBIT', amount, balanceAfter: fromNewBalance });
    await writeLedgerEntry(client, { transId, accountNo: toAccount, entryType: 'CREDIT', amount, balanceAfter: toNewBalance });
    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details") VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [fromAccount, username, `Transfer of ${amount} to Account ${toAccount} successful`]
    );

    await client.query('COMMIT');
    const senderName = await getCustomerNameForAccount(client, fromAccount);
    const receiverName = await getCustomerNameForAccount(client, toAccount);

    res.json({
      success: true,
      message: 'Transfer successful',
      sender: { accountNo: fromAccount, name: senderName, newBalance: fromNewBalance },
      receiver: { accountNo: toAccount, name: receiverName, newBalance: toNewBalance }
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// ---------- PENDING TRANSACTIONS (Maker-Checker) ----------

// List all transactions awaiting approval
exports.getPendingTransactions = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        tl."TransID", tl."FromAccount", tl."ToAccount", tl."Amount", tl."Type",
        tl."UserName", tl."Description", tl."DateTime", e."Name" AS "InitiatedByName"
      FROM "TransactionLog" tl
      LEFT JOIN "Employee" e ON tl."InitiatedBy" = e."EmployeeID"
      WHERE tl."ApprovalStatus" = 'Pending'
      ORDER BY tl."DateTime" ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Approve a pending transaction - this is where the money actually moves
exports.approveTransaction = async (req, res) => {
  const { transId } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: pendingRows } = await client.query(
      `SELECT * FROM "TransactionLog" WHERE "TransID" = $1 AND "ApprovalStatus" = 'Pending' FOR UPDATE`,
      [transId]
    );

    if (pendingRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Pending transaction not found (already processed?)' });
    }

    const txn = pendingRows[0];

    // Four-eyes principle: the approver cannot be the same person who initiated it
    if (txn.InitiatedBy === req.employee.employeeId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, error: 'You cannot approve a transaction you initiated yourself' });
    }

    const amount = parseFloat(txn.Amount);

    if (txn.Type === 'Deposit') {
      const { rows: accRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [txn.ToAccount]);
      const newBalance = parseFloat(accRows[0].Balance) + amount;
      await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [newBalance, txn.ToAccount]);
      await client.query(`INSERT INTO "Deposit" ("TransID", "Amount", "DepositMethod") VALUES ($1, $2, 'Cash')`, [transId, amount]);
      await writeLedgerEntry(client, { transId, accountNo: txn.ToAccount, entryType: 'CREDIT', amount, balanceAfter: newBalance });
    } else if (txn.Type === 'Withdrawal') {
      const { rows: accRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [txn.FromAccount]);
      const currentBalance = parseFloat(accRows[0].Balance);
      if (currentBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient balance - cannot approve' });
      }
      const newBalance = currentBalance - amount;
      await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [newBalance, txn.FromAccount]);
      await client.query(`INSERT INTO "Withdrawal" ("TransID", "Amount", "WithdrawalMethod") VALUES ($1, $2, 'Counter')`, [transId, amount]);
      await writeLedgerEntry(client, { transId, accountNo: txn.FromAccount, entryType: 'DEBIT', amount, balanceAfter: newBalance });
    } else if (txn.Type === 'Transfer') {
      const [firstLock, secondLock] = txn.FromAccount < txn.ToAccount ? [txn.FromAccount, txn.ToAccount] : [txn.ToAccount, txn.FromAccount];
      await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [firstLock]);
      await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [secondLock]);

      const { rows: fromRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [txn.FromAccount]);
      const { rows: toRows } = await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [txn.ToAccount]);
      const fromBalance = parseFloat(fromRows[0].Balance);

      if (fromBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient balance - cannot approve' });
      }

      const fromNewBalance = fromBalance - amount;
      const toNewBalance = parseFloat(toRows[0].Balance) + amount;

      await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [fromNewBalance, txn.FromAccount]);
      await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [toNewBalance, txn.ToAccount]);
      await client.query(`INSERT INTO "Transfer" ("TransID", "Amount", "TransferType") VALUES ($1, $2, 'Internal')`, [transId, amount]);
      await writeLedgerEntry(client, { transId, accountNo: txn.FromAccount, entryType: 'DEBIT', amount, balanceAfter: fromNewBalance });
      await writeLedgerEntry(client, { transId, accountNo: txn.ToAccount, entryType: 'CREDIT', amount, balanceAfter: toNewBalance });
    }

    await client.query(
      `UPDATE "TransactionLog" SET "ApprovalStatus" = 'Approved', "ApprovedBy" = $1 WHERE "TransID" = $2`,
      [req.employee.employeeId, transId]
    );

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'TransactionLog', $1, $2, $3)`,
      [transId, req.employee.name, `Transaction #${transId} approved by ${req.employee.name}`]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Transaction approved and processed' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Approval error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};

// Reject a pending transaction - money never moves
exports.rejectTransaction = async (req, res) => {
  const { transId } = req.params;
  const { reason } = req.body;

  try {
    const { rows } = await pool.query(
      `SELECT "InitiatedBy" FROM "TransactionLog" WHERE "TransID" = $1 AND "ApprovalStatus" = 'Pending'`,
      [transId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pending transaction not found (already processed?)' });
    }

    if (rows[0].InitiatedBy === req.employee.employeeId) {
      return res.status(403).json({ success: false, error: 'You cannot reject a transaction you initiated yourself' });
    }

    await pool.query(
      `UPDATE "TransactionLog" SET "ApprovalStatus" = 'Rejected', "ApprovedBy" = $1 WHERE "TransID" = $2`,
      [req.employee.employeeId, transId]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('ROLLBACK', 'TransactionLog', $1, $2, $3)`,
      [transId, req.employee.name, `Transaction #${transId} rejected by ${req.employee.name}${reason ? ': ' + reason : ''}`]
    );

    res.json({ success: true, message: 'Transaction rejected' });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ---------- LEDGER HISTORY ----------
exports.getAccountLedger = async (req, res) => {
  const { accountNo } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         le."EntryID", le."TransID", le."EntryType", le."Amount", le."BalanceAfter", le."CreatedAt",
         tl."Type" AS "TransactionType", tl."UserName", tl."Description"
       FROM "LedgerEntry" le
       JOIN "TransactionLog" tl ON le."TransID" = tl."TransID"
       WHERE le."AccountNo" = $1
       ORDER BY le."CreatedAt" DESC`,
      [accountNo]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: error.message });
  }
};