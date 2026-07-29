const pool = require('../../config/db');

// Online transfers above this amount are not allowed self-service -
// the customer must visit a branch. Keeps large fraud-prone transfers
// under staff supervision, same spirit as the employee-side threshold.
const ONLINE_TRANSFER_LIMIT = 100000;

// GET /api/customer-portal/accounts - only the logged-in customer's own accounts
exports.getMyAccounts = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT "AccountNo", "Type", "Balance", "Status"
       FROM "Account"
       WHERE "CustomerID" = $1
       ORDER BY "AccountNo"`,
      [req.customer.customerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customer accounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper: confirms an account number actually belongs to the logged-in customer.
// Every self-service action must call this first - without it, a customer could
// pass any account number in the URL/body and touch someone else's money.
async function accountBelongsToCustomer(accountNo, customerId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM "Account" WHERE "AccountNo" = $1 AND "CustomerID" = $2`,
    [accountNo, customerId]
  );
  return rows.length > 0;
}

// GET /api/customer-portal/ledger/:accountNo - only if it's their own account
exports.getMyLedger = async (req, res) => {
  const { accountNo } = req.params;

  try {
    const owns = await accountBelongsToCustomer(accountNo, req.customer.customerId);
    if (!owns) {
      return res.status(403).json({ error: 'This account does not belong to you' });
    }

    const { rows } = await pool.query(
      `SELECT le."EntryID", le."TransID", le."EntryType", le."Amount", le."BalanceAfter", le."CreatedAt",
              tl."Type" AS "TransactionType", tl."Description"
       FROM "LedgerEntry" le
       JOIN "TransactionLog" tl ON le."TransID" = tl."TransID"
       WHERE le."AccountNo" = $1
       ORDER BY le."CreatedAt" DESC`,
      [accountNo]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching customer ledger:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/customer-portal/transfer - self-service transfer
// fromAccount MUST belong to the logged-in customer. toAccount can be any
// valid account (sending money to someone else), like real online banking.
exports.transfer = async (req, res) => {
  const { fromAccount, toAccount, amount } = req.body;
  const customerId = req.customer.customerId;

  if (!fromAccount || !toAccount || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'fromAccount, toAccount and a valid amount are required' });
  }
  if (fromAccount == toAccount) {
    return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
  }
  if (amount > ONLINE_TRANSFER_LIMIT) {
    return res.status(400).json({
      success: false,
      error: `Online transfers are limited to ${ONLINE_TRANSFER_LIMIT}. Please visit your branch for larger transfers.`
    });
  }

  const owns = await accountBelongsToCustomer(fromAccount, customerId);
  if (!owns) {
    return res.status(403).json({ success: false, error: 'You can only transfer from your own account' });
  }

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
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const fromNewBalance = fromBalance - parseFloat(amount);
    const toNewBalance = toBalance + parseFloat(amount);

    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [fromNewBalance, fromAccount]);
    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [toNewBalance, toAccount]);

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName", "Description", "InitiatedByCustomer", "ApprovalStatus")
       VALUES ($1, $2, $3, 'Transfer', 'Success', $4, $5, $6, 'Auto-Approved')
       RETURNING "TransID"`,
      [fromAccount, toAccount, amount, req.customer.name, `Online transfer of ${amount} from ${fromAccount} to ${toAccount}`, customerId]
    );
    const transId = transRows[0].TransID;

    await client.query(`INSERT INTO "Transfer" ("TransID", "Amount", "TransferType") VALUES ($1, $2, 'Internal')`, [transId, amount]);

    await client.query(
      `INSERT INTO "LedgerEntry" ("TransID", "AccountNo", "EntryType", "Amount", "BalanceAfter") VALUES ($1, $2, 'DEBIT', $3, $4)`,
      [transId, fromAccount, amount, fromNewBalance]
    );
    await client.query(
      `INSERT INTO "LedgerEntry" ("TransID", "AccountNo", "EntryType", "Amount", "BalanceAfter") VALUES ($1, $2, 'CREDIT', $3, $4)`,
      [transId, toAccount, amount, toNewBalance]
    );

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [fromAccount, req.customer.name, `Online transfer of ${amount} to Account ${toAccount} (self-service)`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Transfer successful',
      newBalance: fromNewBalance
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Customer transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
};