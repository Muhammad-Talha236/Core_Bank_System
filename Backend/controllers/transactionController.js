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
      `INSERT INTO "TransactionLog" ("ToAccount", "Amount", "Type", "Status", "UserName")
       VALUES ($1, $2, 'Deposit', 'Success', $3)
       RETURNING "TransID"`,
      [accountNo, amount, username]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Deposit" ("TransID", "Amount", "DepositMethod") VALUES ($1, $2, $3)`,
      [transId, amount, method]
    );

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
      `INSERT INTO "TransactionLog" ("FromAccount", "Amount", "Type", "Status", "UserName")
       VALUES ($1, $2, 'Withdrawal', 'Success', $3)
       RETURNING "TransID"`,
      [accountNo, amount, username]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Withdrawal" ("TransID", "Amount", "WithdrawalMethod") VALUES ($1, $2, $3)`,
      [transId, amount, method]
    );

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
      `INSERT INTO "TransactionLog" ("FromAccount", "ToAccount", "Amount", "Type", "Status", "UserName")
       VALUES ($1, $2, $3, 'Transfer', 'Success', $4)
       RETURNING "TransID"`,
      [fromAccount, toAccount, amount, username]
    );
    const transId = transRows[0].TransID;

    await client.query(
      `INSERT INTO "Transfer" ("TransID", "Amount", "TransferType") VALUES ($1, $2, 'Internal')`,
      [transId, amount]
    );

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