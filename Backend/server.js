require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Serve frontend
app.use('/frontend', express.static(path.join(__dirname, '..', 'Frontend')));

// ==================== HELPER FUNCTIONS ====================

// Generate unique 8-digit account number (FIXED: Changed from 12 to 8 digits)
async function generateAccountNumber() {
  let accountNo;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (exists && attempts < maxAttempts) {
    // Generate 8-digit number (10,000,000 to 99,999,999)
    accountNo = Math.floor(10000000 + Math.random() * 90000000);
    
    // Check if it already exists
    try {
      const [rows] = await pool.query('SELECT AccountNo FROM Account WHERE AccountNo = ?', [accountNo]);
      exists = rows.length > 0;
    } catch (error) {
      console.error('Error checking account number:', error);
      exists = true; // Continue loop on error
    }
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique account number after multiple attempts');
  }
  
  return accountNo;
}

/**
 * NEW HELPER FUNCTION: Check if an account number exists and is active.
 * @param {number} accountNo 
 * @returns {Promise<boolean>}
 */
async function checkAccountExists(accountNo) {
  try {
    const [rows] = await pool.query(
      'SELECT AccountNo FROM Account WHERE AccountNo = ? AND Status = "Active"',
      [accountNo]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Database error during account existence check:', error);
    return false; // Treat error as non-existent for safety
  }
}

// ==================== CUSTOMER ROUTES ====================

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        CustomerID as CustID,
        Name,
        CNIC,
        Contact,
        Gmail
      FROM Customer
      ORDER BY CustomerID DESC
    `);
    console.log('Customers fetched:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add customer WITH account creation (FIXED: Now generates 8-digit account numbers)
// Add customer WITH account creation (FIXED: Auto-increment issue resolved)
// Add customer WITH account creation and initial balance
app.post('/api/customers', async (req, res) => {
  console.log('POST /api/customers body:', req.body);
  const { name, cnic, contact, gmail, accountType, initialBalance } = req.body;

  // Enhanced validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }
  if (!cnic || !cnic.trim()) {
    return res.status(400).json({ error: 'CNIC is required' });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ error: 'Contact number is required' });
  }
  if (!accountType) {
    return res.status(400).json({ error: 'Account type is required' });
  }

  // CNIC format validation (12345-1234567-1)
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  if (!cnicRegex.test(cnic)) {
    return res.status(400).json({ error: 'CNIC must be in format: 12345-1234567-1' });
  }

  // Contact format validation (03XX-XXXXXXX)
  const contactRegex = /^03\d{2}-\d{7}$/;
  if (!contactRegex.test(contact)) {
    return res.status(400).json({ error: 'Contact must be in format: 03XX-XXXXXXX' });
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (gmail && !emailRegex.test(gmail)) {
    return res.status(400).json({ error: 'Please enter a valid Gmail address' });
  }

  // Balance validation
  const balance = parseFloat(initialBalance) || 0;
  if (balance < 0) {
    return res.status(400).json({ error: 'Initial balance cannot be negative' });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Check if customer already exists (by CNIC) - BEFORE any insert
    const [existingCustomer] = await connection.query(
      'SELECT CustomerID FROM Customer WHERE CNIC = ?',
      [cnic]
    );
    
    if (existingCustomer.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Customer with this CNIC already exists' });
    }

    // Check if customer already exists by email
    if (gmail) {
      const [existingEmail] = await connection.query(
        'SELECT CustomerID FROM Customer WHERE Gmail = ?',
        [gmail]
      );
      
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'Customer with this email already exists' });
      }
    }
    
    // Get the next available CustomerID manually to prevent auto-increment gap
    const [maxIdResult] = await connection.query(
      'SELECT COALESCE(MAX(CustomerID), 0) + 1 as nextId FROM Customer'
    );
    const nextCustomerId = maxIdResult[0].nextId;

    // Insert customer with explicit CustomerID
    const [customerResult] = await connection.query(
      'INSERT INTO Customer (CustomerID, Name, CNIC, Contact, Gmail) VALUES (?, ?, ?, ?, ?)',
      [nextCustomerId, name.trim(), cnic.trim(), contact.trim(), gmail ? gmail.trim() : null]
    );
    
    const customerId = customerResult.insertId;
    
    // Generate unique 8-digit account number
    const accountNo = await generateAccountNumber();
    const accType = accountType === 'SAV' ? 'Savings' : 'Current';
    
    console.log(`Creating account: ${accountNo} for customer ${customerId}, type: ${accType}, balance: ${balance}`);
    
    // Insert account with generated account number AND initial balance
    await connection.query(
      'INSERT INTO Account (AccountNo, CustomerID, Type, Balance) VALUES (?, ?, ?, ?)',
      [accountNo, customerId, accType, balance]
    );
    
    // Insert into specialized account table
    if (accType === 'Savings') {
      await connection.query(
        'INSERT INTO SavingAccount (AccountNo, InterestRate) VALUES (?, 3.50)',
        [accountNo]
      );
    } else {
      await connection.query(
        'INSERT INTO CurrentAccount (AccountNo, OverdraftLimit) VALUES (?, 5000)',
        [accountNo]
      );
    }
    
    // Log the account creation in audit log
    await connection.query(
      'INSERT INTO AuditLog (Operation, TableAffected, RecordID, UserName, Details) VALUES (?, ?, ?, ?, ?)',
      ['INSERT', 'Account', accountNo, name, `Account created with initial balance: ${balance}`]
    );
    
    await connection.commit();
    console.log('Customer and Account created successfully:', { 
      customerId, 
      accountNo, 
      balance 
    });
    
    res.json({ 
      success: true, 
      customerId: customerId,
      accountNo: accountNo,
      initialBalance: balance,
      message: `Customer and account created successfully with balance ₹${balance.toFixed(2)}`
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error inserting customer:', error);
    
    // Specific error handling
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('CNIC')) {
        res.status(400).json({ error: 'Customer with this CNIC already exists' });
      } else if (error.sqlMessage.includes('Gmail')) {
        res.status(400).json({ error: 'Customer with this email already exists' });
      } else {
        res.status(400).json({ error: 'Duplicate entry found' });
      }
    } else {
      res.status(500).json({ error: error.message });
    }
  } finally {
    connection.release();
  }
});
// ==================== ACCOUNT ROUTES ====================

// Get all accounts with customer details
app.get('/api/accounts', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.AccountNo,
        a.CustomerID as CustID,
        c.Name as CustomerName,
        a.Type,
        a.Balance,
        a.Status
      FROM Account a
      JOIN Customer c ON a.CustomerID = c.CustomerID
      ORDER BY a.AccountNo DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if customer already has an account
app.get('/api/accounts/check/:customerId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT AccountNo FROM Account WHERE CustomerID = ?',
      [req.params.customerId]
    );
    res.json({ hasAccount: rows.length > 0, accounts: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRANSACTION ROUTES ====================

// ==================== TRANSACTION ROUTES ====================
// ==================== TRANSACTION ROUTES ====================

// ---------- DEPOSIT ----------
app.post('/api/transactions/deposit', async (req, res) => {
  const { accountNo, amount, user } = req.body;
  const username = user || 'system';

  try {
    if (!accountNo || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
    }

    // ⭐ ACCOUNT VALIDATION CHECK
    if (!(await checkAccountExists(accountNo))) {
        return res.status(404).json({ success: false, error: `Error: Account No. ${accountNo} not found or inactive.` });
    }

    // Call the Stored Procedure
    const [rows] = await pool.query(
      'CALL sp_deposit(?, ?, ?, ?)', 
      [accountNo, amount, 'Cash', username]
    );

    // FIX: Properly extract the result from the Stored Procedure packet
    const resultPacket = rows[0][0];

    // Check if SQL returned a logic error (handled in your SP)
    if (resultPacket && resultPacket.message && resultPacket.message.startsWith('Error')) {
      return res.status(400).json({ success: false, error: resultPacket.message });
    }

    // Optional: Get Customer Name for display
    const [custInfo] = await pool.query(
      'SELECT Name FROM Customer C JOIN Account A ON C.CustomerID = A.CustomerID WHERE A.AccountNo = ?',
      [accountNo]
    );
    const customerName = custInfo.length > 0 ? custInfo[0].Name : 'Unknown';

    res.json({
      success: true,
      message: 'Deposit successful',
      receiver: { 
        accountNo: accountNo, 
        name: customerName, 
        newBalance: resultPacket ? resultPacket.new_balance : amount 
      }
    });

  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- WITHDRAW ----------
app.post('/api/transactions/withdraw', async (req, res) => {
  const { accountNo, amount, user } = req.body;
  const username = user || 'system';

  try {
    if (!accountNo || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid account number and amount required' });
    }
    
    // ⭐ ACCOUNT VALIDATION CHECK
    if (!(await checkAccountExists(accountNo))) {
        return res.status(404).json({ success: false, error: `Error: Account No. ${accountNo} not found or inactive.` });
    }


    const [rows] = await pool.query(
      'CALL sp_withdraw(?, ?, ?, ?)', 
      [accountNo, amount, 'Counter', username]
    );

    const resultPacket = rows[0][0];

    if (resultPacket && resultPacket.message && resultPacket.message.startsWith('Error')) {
      return res.status(400).json({ success: false, error: resultPacket.message });
    }

    const [custInfo] = await pool.query(
      'SELECT Name FROM Customer C JOIN Account A ON C.CustomerID = A.CustomerID WHERE A.AccountNo = ?',
      [accountNo]
    );
    const customerName = custInfo.length > 0 ? custInfo[0].Name : 'Unknown';

    res.json({
      success: true,
      message: 'Withdrawal successful',
      sender: { 
        accountNo: accountNo, 
        name: customerName, 
        newBalance: resultPacket ? resultPacket.new_balance : 0 
      }
    });

  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- TRANSFER ----------
// ---------- TRANSFER ----------
app.post('/api/transactions/transfer', async (req, res) => {
  console.log('Transfer Request Received:', req.body);

  // Destructure all potential variable names
  let { fromAccount, toAccount, amount, user, accountNo } = req.body;
  const username = user || 'system';

  // FIX: Handle variable mismatch.
  // The frontend is sending 'accountNo' for the sender, but we expected 'fromAccount'.
  if (!fromAccount && accountNo) {
      fromAccount = accountNo;
  }

  try {
    // 1. Validation
    if (!fromAccount) {
        return res.status(400).json({ success: false, error: 'Missing Sender Account (fromAccount/accountNo)' });
    }
    if (!toAccount) {
        return res.status(400).json({ success: false, error: 'Missing Receiver Account (toAccount)' });
    }
    if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount entered' });
    }
    if (fromAccount == toAccount) {
        return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
    }
    
    // ⭐ ACCOUNT VALIDATION CHECK: Check both accounts
    if (!(await checkAccountExists(fromAccount))) {
        return res.status(404).json({ success: false, error: `Error: Sender Account No. ${fromAccount} not found or inactive.` });
    }
    if (!(await checkAccountExists(toAccount))) {
        return res.status(404).json({ success: false, error: `Error: Receiver Account No. ${toAccount} not found or inactive.` });
    }

    // 2. Call Stored Procedure
    const [rows] = await pool.query(
      'CALL sp_transfer(?, ?, ?, ?)', 
      [fromAccount, toAccount, amount, username]
    );

    const resultPacket = rows[0][0];

    // 3. Handle SQL Errors
    if (resultPacket && resultPacket.message && resultPacket.message.startsWith('Error')) {
      return res.status(400).json({ success: false, error: resultPacket.message });
    }

    // 4. Fetch Names for Receipt
    const [senderInfo] = await pool.query(
        'SELECT Name FROM Customer C JOIN Account A ON C.CustomerID = A.CustomerID WHERE A.AccountNo = ?',
        [fromAccount]
    );
    const [receiverInfo] = await pool.query(
        'SELECT Name FROM Customer C JOIN Account A ON C.CustomerID = A.CustomerID WHERE A.AccountNo = ?',
        [toAccount]
    );

    res.json({
      success: true,
      message: 'Transfer successful',
      sender: { 
        accountNo: fromAccount, 
        name: senderInfo[0]?.Name || 'Sender', 
        newBalance: resultPacket ? resultPacket.sender_new_balance : 0
      },
      receiver: { 
        accountNo: toAccount, 
        name: receiverInfo[0]?.Name || 'Receiver', 
        newBalance: resultPacket ? resultPacket.receiver_new_balance : 0
      }
    });

  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ==================== AUDIT ROUTES ====================

// Get audit logs
app.get('/api/audit', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        LogID,
        Operation,
        TableAffected,
        RecordID,
        UserName,
        DateTime as CreatedAt,
        Details
      FROM AuditLog
      ORDER BY DateTime DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, database: process.env.DB_NAME });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CBS Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}/frontend/index.html`);
  console.log(`🔢 Account Numbers: 8-digit format (10,000,000 - 99,999,999)`);
});