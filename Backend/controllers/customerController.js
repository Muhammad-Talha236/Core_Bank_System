const pool = require('../db/connection');
const crypto = require('crypto');

// helper: 8-digit as string (10,000,000 .. 99,999,999)
function generateAccountNumber() {
    try {
        return String(crypto.randomInt(10000000, 100000000)); // upper bound exclusive
    } catch (e) {
        // fallback
        return String(Math.floor(Math.random() * 90000000) + 10000000);
    }
}

// Get all customers
exports.getAllCustomers = async (req, res) => {
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

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO Customer (Name, CNIC, Contact, Gmail) VALUES (?, ?, ?, ?)',
      [name, cnic, contact, email]
    );

    const customerId = result.insertId;

    // generate unique 8-digit account number (retry on duplicate)
    let accountNo;
    const maxAttempts = 5;
    let attempts = 0;
    while (attempts < maxAttempts) {
      accountNo = generateAccountNumber();
      try {
        await conn.query(
          'INSERT INTO Account (AccountNo, CustomerID, Type, Balance, Status) VALUES (?, ?, ?, ?, ?)',
          [accountNo, customerId, 'Savings', 0.00, 'Active']
        );
        break; // success
      } catch (err) {
        if (err && err.code === 'ER_DUP_ENTRY') {
          attempts++;
          continue; // try again
        }
        throw err;
      }
    }

    if (attempts === maxAttempts) {
      throw new Error('Failed to generate unique account number after multiple attempts');
    }

    await conn.commit();

    res.json({
      success: true,
      customerId,
      accountNo,
      message: 'Customer and account created successfully'
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error('Error adding customer:', error);
    res.status(500).json({ error: error.message });
  } finally {
    conn.release();
  }
};