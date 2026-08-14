const pool = require('../../config/db');

// --- Validation helpers -----------------------------------------------
// Client-side checks can always be bypassed (Postman, curl, etc), so the
// same rules are enforced again here before anything touches the DB.
function isValidName(name) {
  return /^[A-Za-z\s]{3,}$/.test((name || '').trim());
}
function isValidCode(code) {
  return /^[A-Za-z0-9]{2,10}$/.test((code || '').trim());
}
function isValidCity(city) {
  // City is optional, but if provided it must be letters/spaces only
  return !city || /^[A-Za-z\s]+$/.test(city.trim());
}
// ------------------------------------------------------------------------

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

  if (!isValidName(branchName)) {
    return res.status(400).json({ error: 'Branch name must be at least 3 characters and contain letters only' });
  }

  if (!isValidCode(branchCode)) {
    return res.status(400).json({ error: 'Branch code must be 2-10 letters/numbers, no spaces or symbols' });
  }

  if (!isValidCity(city)) {
    return res.status(400).json({ error: 'City can only contain letters and spaces' });
  }

  if (address && address.trim().length < 5) {
    return res.status(400).json({ error: 'Address looks too short' });
  }

  const cleanName = branchName.trim();
  const cleanCode = branchCode.trim().toUpperCase();
  const cleanCity = city ? city.trim() : null;
  const cleanAddress = address ? address.trim() : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO "Branch" ("BranchName", "BranchCode", "City", "Address")
       VALUES ($1, $2, $3, $4)
       RETURNING "BranchID"`,
      [cleanName, cleanCode, cleanCity, cleanAddress]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "EmployeeID", "Details")
       VALUES ('INSERT', 'Branch', $1, $2, $3, $4)`,
      [rows[0].BranchID, req.employee.name, req.employee.employeeId, `Branch "${cleanName}" (${cleanCode}) created`]
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