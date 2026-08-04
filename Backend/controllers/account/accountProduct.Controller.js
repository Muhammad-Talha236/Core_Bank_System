const pool = require('../../config/db');

// GET /api/accounts/products?type=Savings
exports.getProducts = async (req, res) => {
  const { type } = req.query;

  try {
    const query = type
      ? `SELECT "ProductID", "ProductName", "AccountType", "TermMonths", "InterestRate", "Description"
         FROM "AccountProduct" WHERE "AccountType" = $1 AND "IsActive" = TRUE ORDER BY "ProductName"`
      : `SELECT "ProductID", "ProductName", "AccountType", "TermMonths", "InterestRate", "Description"
         FROM "AccountProduct" WHERE "IsActive" = TRUE ORDER BY "AccountType", "ProductName"`;

    const { rows } = type ? await pool.query(query, [type]) : await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching account products:', error);
    res.status(500).json({ error: error.message });
  }
};
