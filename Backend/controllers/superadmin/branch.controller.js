const pool = require('../../config/db');

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT "BranchID", "BranchName", "BranchCode", "City", "Address", "CreatedAt"
      FROM "Branch"
      ORDER BY "BranchID"
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new branch
exports.createBranch = async (req, res) => {
  const { branchName, branchCode, city, address } = req.body;

  if (!branchName || !branchCode) {
    return res.status(400).json({ error: 'branchName and branchCode are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO "Branch" ("BranchName", "BranchCode", "City", "Address")
       VALUES ($1, $2, $3, $4)
       RETURNING "BranchID"`,
      [branchName, branchCode.toUpperCase(), city || null, address || null]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('INSERT', 'Branch', $1, $2, $3)`,
      [rows[0].BranchID, req.employee.name, `Branch "${branchName}" (${branchCode}) created`]
    );

    res.json({ success: true, branchId: rows[0].BranchID, message: 'Branch created successfully' });
  } catch (error) {
    console.error('Error creating branch:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A branch with this branch code already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};
