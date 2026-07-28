const pool = require('../db/connection');

// Fetch customer name for an account (used to build response objects)
async function getCustomerNameForAccount(client, accountNo) {
  const { rows } = await client.query(
    `SELECT c."Name" FROM "Customer" c
     JOIN "Account" a ON c."CustomerID" = a."CustomerID"
     WHERE a."AccountNo" = $1`,
    [accountNo]
  );
  return rows.length > 0 ? rows[0].Name : 'Unknown';
}

// Write one immutable ledger row. This is the audit-proof source of truth -
// it is NEVER updated or deleted after being written. Corrections happen by
// writing a new, opposite ledger entry (a reversal), not by editing this one.
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
  const username = user || 'system';
  const method = 'Cash';

  if (!accountNo || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row so concurrent transactions on this account queue up safely
    const { rows: accRows } = await client.query(
      `SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`,
      [accountNo]
    );

    if (accRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Account not found' });
    }

    const currentBalance = parseFloat(accRows[0].Balance);
    const newBalance = currentBalance + parseFloat(amount);

    await client.query(
      `UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`,
      [newBalance, accountNo]
    );

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("ToAccount", "Amount", "Type", "Status", "UserName", "Description")
       VALUES ($1, $2, 'Deposit', 'Success', $3, $4)
       RETURNING "TransID"`,
      [accountNo, amount, username, `Cash deposit of ${amount}`]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Deposit" ("TransID", "Amount", "DepositMethod") VALUES ($1, $2, $3)`,
      [transId, amount, method]
    );

    // Ledger: money coming IN to this account = CREDIT
    await writeLedgerEntry(client, {
      transId, accountNo, entryType: 'CREDIT', amount, balanceAfter: newBalance
    });

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [accountNo, username, `Deposit of ${amount} successful`]
    );

    await client.query('COMMIT');

    const customerName = await getCustomerNameForAccount(client, accountNo);

    res.json({
      success: true,
      message: 'Deposit successful',
      receiver: { accountNo, name: customerName, newBalance }
    });
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
  const username = user || 'system';
  const method = 'Counter';

  if (!accountNo || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
  }

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
      await client.query('COMMIT'); // commit the audit log entry itself
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const newBalance = currentBalance - parseFloat(amount);

    await client.query(
      `UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`,
      [newBalance, accountNo]
    );

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "Amount", "Type", "Status", "UserName", "Description")
       VALUES ($1, $2, 'Withdrawal', 'Success', $3, $4)
       RETURNING "TransID"`,
      [accountNo, amount, username, `Counter withdrawal of ${amount}`]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Withdrawal" ("TransID", "Amount", "WithdrawalMethod") VALUES ($1, $2, $3)`,
      [transId, amount, method]
    );

    // Ledger: money going OUT of this account = DEBIT
    await writeLedgerEntry(client, {
      transId, accountNo, entryType: 'DEBIT', amount, balanceAfter: newBalance
    });

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'Account', $1, $2, $3)`,
      [accountNo, username, `Withdrawal of ${amount} successful`]
    );

    await client.query('COMMIT');

    const customerName = await getCustomerNameForAccount(client, accountNo);

    res.json({
      success: true,
      message: 'Withdrawal successful',
      sender: { accountNo, name: customerName, newBalance }
    });
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
  const username = user || 'system';

  if (!fromAccount && accountNo) fromAccount = accountNo;

  if (!fromAccount) return res.status(400).json({ success: false, error: 'Missing sender account' });
  if (!toAccount) return res.status(400).json({ success: false, error: 'Missing receiver account' });
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid amount entered' });
  }
  if (fromAccount == toAccount) {
    return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock both rows in a consistent order (lowest account number first)
    // to avoid deadlocks when two transfers happen between the same two accounts at once.
    const [firstLock, secondLock] = fromAccount < toAccount
      ? [fromAccount, toAccount]
      : [toAccount, fromAccount];

    await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [firstLock]);
    await client.query(`SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1 FOR UPDATE`, [secondLock]);

    const { rows: fromRows } = await client.query(
      `SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [fromAccount]
    );
    const { rows: toRows } = await client.query(
      `SELECT "Balance" FROM "Account" WHERE "AccountNo" = $1`, [toAccount]
    );

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

    const fromNewBalance = fromBalance - parseFloat(amount);
    const toNewBalance = toBalance + parseFloat(amount);

    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [fromNewBalance, fromAccount]);
    await client.query(`UPDATE "Account" SET "Balance" = $1 WHERE "AccountNo" = $2`, [toNewBalance, toAccount]);

    const { rows: transRows } = await client.query(
      `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName", "Description")
       VALUES ($1, $2, $3, 'Transfer', 'Success', $4, $5)
       RETURNING "TransID"`,
      [fromAccount, toAccount, amount, username, `Transfer of ${amount} from ${fromAccount} to ${toAccount}`]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Transfer" ("TransID", "Amount", "TransferType") VALUES ($1, $2, 'Internal')`,
      [transId, amount]
    );

    // Ledger: two entries for one transfer - this is the actual double-entry part.
    // DEBIT the sender, CREDIT the receiver. They must always balance to zero.
    await writeLedgerEntry(client, {
      transId, accountNo: fromAccount, entryType: 'DEBIT', amount, balanceAfter: fromNewBalance
    });
    await writeLedgerEntry(client, {
      transId, accountNo: toAccount, entryType: 'CREDIT', amount, balanceAfter: toNewBalance
    });

    await client.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('COMMIT', 'Account', $1, $2, $3)`,
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

// ---------- LEDGER HISTORY (new) ----------
// Returns the full, immutable ledger trail for one account - this is what
// an auditor or bank statement would actually be built from.
exports.getAccountLedger = async (req, res) => {
  const { accountNo } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         le."EntryID",
         le."TransID",
         le."EntryType",
         le."Amount",
         le."BalanceAfter",
         le."CreatedAt",
         tl."Type" AS "TransactionType",
         tl."UserName",
         tl."Description"
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