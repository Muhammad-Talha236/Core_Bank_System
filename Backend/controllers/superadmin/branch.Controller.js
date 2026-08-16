const pool = require('../../config/db');

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT "BranchID", "BranchName", "BranchCode", "City", "Address", "IsActive", "CreatedAt"
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

// Update a branch's name, code, city, or address
exports.updateBranch = async (req, res) => {
  const { branchId } = req.params;
  const { branchName, branchCode, city, address } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE "Branch"
       SET "BranchName" = COALESCE($1, "BranchName"),
           "BranchCode" = COALESCE($2, "BranchCode"),
           "City" = COALESCE($3, "City"),
           "Address" = COALESCE($4, "Address")
       WHERE "BranchID" = $5
       RETURNING "BranchID"`,
      [branchName || null, branchCode ? branchCode.toUpperCase() : null, city || null, address || null, branchId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('UPDATE', 'Branch', $1, $2, $3)`,
      [branchId, req.employee.name, `Branch #${branchId} updated by ${req.employee.name}`]
    );

    res.json({ success: true, message: 'Branch updated successfully' });
  } catch (error) {
    console.error('Error updating branch:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'A branch with this branch code already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Mark a branch Active/Inactive. This never deletes the branch - historical
// accounts, employees, and audit entries stay linked to it. Deactivating
// just hides it from new employee/account assignment.
exports.updateBranchStatus = async (req, res) => {
  const { branchId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'isActive must be true or false' });
  }

  try {
    if (!isActive) {
      // A branch can't go inactive while it still has active staff -
      // they'd be left assigned to a branch that's officially closed.
      const { rows: activeStaff } = await pool.query(
        `SELECT COUNT(*) FROM "Employee" WHERE "BranchID" = $1 AND "Status" = 'Active'`,
        [branchId]
      );
      if (parseInt(activeStaff[0].count) > 0) {
        return res.status(400).json({
          error: 'Cannot deactivate a branch with active employees assigned to it. Reassign or suspend them first.'
        });
      }
    }

    const { rows } = await pool.query(
      `UPDATE "Branch" SET "IsActive" = $1 WHERE "BranchID" = $2 RETURNING "BranchName"`,
      [isActive, branchId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('UPDATE', 'Branch', $1, $2, $3)`,
      [branchId, req.employee.name, `Branch "${rows[0].BranchName}" marked ${isActive ? 'Active' : 'Inactive'} by ${req.employee.name}`]
    );

    res.json({ success: true, message: `Branch marked ${isActive ? 'Active' : 'Inactive'}` });
  } catch (error) {
    console.error('Error updating branch status:', error);
    res.status(500).json({ error: error.message });
  }
};