const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

// --- Validation helpers -----------------------------------------------
// Client-side checks can always be bypassed (Postman, curl, etc), so the
// same rules are enforced again here before anything touches the DB.
function isValidName(name) {
  return /^[A-Za-z\s]{3,}$/.test((name || '').trim());
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}
// ------------------------------------------------------------------------

// Get all employees (with role and branch names attached)
exports.getAllEmployees = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        e."EmployeeID", e."Name", e."Email", r."RoleName", e."RoleID",
        e."BranchID", b."BranchName", e."Status", e."FailedLoginAttempts",
        e."LastLogin", e."CreatedAt"
      FROM "Employee" e
      JOIN "Role" r ON e."RoleID" = r."RoleID"
      LEFT JOIN "Branch" b ON e."BranchID" = b."BranchID"
      ORDER BY e."EmployeeID" DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all roles (for populating a dropdown when creating/editing an employee)
exports.getAllRoles = async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT "RoleID", "RoleName", "Description" FROM "Role" ORDER BY "RoleID"`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new employee (any role, including another SuperAdmin)
exports.createEmployee = async (req, res) => {
  const { name, email, password, roleId, branchId } = req.body;

  if (!name || !email || !password || !roleId) {
    return res.status(400).json({ error: 'name, email, password and roleId are required' });
  }

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Name must be at least 3 characters and contain letters only' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO "Employee" ("Name", "Email", "PasswordHash", "RoleID", "BranchID", "Status")
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING "EmployeeID"`,
      [cleanName, cleanEmail, passwordHash, roleId, branchId || null]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "EmployeeID", "Details")
       VALUES ('INSERT', 'Employee', $1, $2, $3, $4)`,
      [rows[0].EmployeeID, req.employee.name, req.employee.employeeId, `Employee "${cleanName}" (${cleanEmail}) created by ${req.employee.name}`]
    );

    res.json({ success: true, employeeId: rows[0].EmployeeID, message: 'Employee created successfully' });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'An employee with this email already exists' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid roleId or branchId' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update an employee's role and/or branch
exports.updateEmployee = async (req, res) => {
  const { employeeId } = req.params;
  const { name, roleId, branchId } = req.body;

  if (name !== undefined && name !== null && !isValidName(name)) {
    return res.status(400).json({ error: 'Name must be at least 3 characters and contain letters only' });
  }

  const cleanName = name ? name.trim() : null;

  try {
    const { rows } = await pool.query(
      `UPDATE "Employee"
       SET "Name" = COALESCE($1, "Name"),
           "RoleID" = COALESCE($2, "RoleID"),
           "BranchID" = COALESCE($3, "BranchID")
       WHERE "EmployeeID" = $4
       RETURNING "EmployeeID"`,
      [cleanName, roleId || null, branchId || null, employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "EmployeeID", "Details")
       VALUES ('UPDATE', 'Employee', $1, $2, $3, $4)`,
      [employeeId, req.employee.name, req.employee.employeeId, `Employee #${employeeId} updated by ${req.employee.name}`]
    );
    res.json({ success: true, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: error.message });
  }
};

// Change employee status: Active / Suspended / Locked
// Also resets FailedLoginAttempts to 0 when unlocking, so they can log in again
exports.updateEmployeeStatus = async (req, res) => {
  const { employeeId } = req.params;
  const { status } = req.body;

  if (!['Active', 'Suspended', 'Locked'].includes(status)) {
    return res.status(400).json({ error: 'status must be Active, Suspended, or Locked' });
  }

  // Nobody can suspend/lock their own account - this is how real banking
  // systems avoid an accidental (or malicious) self-lockout.
  if (parseInt(employeeId) === req.employee.employeeId && status !== 'Active') {
    return res.status(403).json({ error: 'You cannot suspend or lock your own account' });
  }

  try {
    // Never allow the last remaining active SuperAdmin to be deactivated -
    // that would leave nobody able to manage the system at all.
    if (status !== 'Active') {
      const { rows: targetRows } = await pool.query(`SELECT r."RoleName" FROM "Employee" e JOIN "Role" r ON e."RoleID" = r."RoleID" WHERE e."EmployeeID" = $1`, [employeeId]);
      if (targetRows.length > 0 && targetRows[0].RoleName === 'SuperAdmin') {
        const { rows: activeCountRows } = await pool.query(
          `SELECT COUNT(*) FROM "Employee" e JOIN "Role" r ON e."RoleID" = r."RoleID"
           WHERE r."RoleName" = 'SuperAdmin' AND e."Status" = 'Active'`
        );
        if (parseInt(activeCountRows[0].count) <= 1) {
          return res.status(400).json({ error: 'Cannot deactivate the last active SuperAdmin. Promote another employee to SuperAdmin first.' });
        }
      }
    }

    const resetAttempts = status === 'Active';

    const { rows } = await pool.query(
      `UPDATE "Employee"
       SET "Status" = $1, "FailedLoginAttempts" = CASE WHEN $2 THEN 0 ELSE "FailedLoginAttempts" END
       WHERE "EmployeeID" = $3
       RETURNING "EmployeeID", "Name"`,
      [status, resetAttempts, employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "EmployeeID", "Details")
       VALUES ('UPDATE', 'Employee', $1, $2, $3, $4)`,
      [employeeId, req.employee.name, req.employee.employeeId, `Employee "${rows[0].Name}" status changed to ${status} by ${req.employee.name}`]
    );

    res.json({ success: true, message: `Employee status updated to ${status}` });
  } catch (error) {
    console.error('Error updating employee status:', error);
    res.status(500).json({ error: error.message });
  }
};