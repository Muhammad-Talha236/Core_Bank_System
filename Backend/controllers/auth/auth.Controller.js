const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MAX_FAILED_ATTEMPTS = 5;
const TOKEN_EXPIRY = '8h';

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT
         e."EmployeeID", e."Name", e."Email", e."PasswordHash",
         e."Status", e."FailedLoginAttempts",
         r."RoleName", e."BranchID", b."BranchName"
       FROM "Employee" e
       JOIN "Role" r ON e."RoleID" = r."RoleID"
       LEFT JOIN "Branch" b ON e."BranchID" = b."BranchID"
       WHERE e."Email" = $1`,
      [email]
    );

    if (rows.length === 0) {
      await client.query(
        `INSERT INTO "LoginAudit" ("Email", "Success", "IPAddress") VALUES ($1, false, $2)`,
        [email, ipAddress]
      );
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const employee = rows[0];

    if (employee.Status === 'Locked') {
      await client.query(
        `INSERT INTO "LoginAudit" ("EmployeeID", "Email", "Success", "IPAddress") VALUES ($1, $2, false, $3)`,
        [employee.EmployeeID, email, ipAddress]
      );
      return res.status(403).json({ error: 'Account locked due to too many failed login attempts. Contact your administrator.' });
    }

    if (employee.Status === 'Suspended') {
      await client.query(
        `INSERT INTO "LoginAudit" ("EmployeeID", "Email", "Success", "IPAddress") VALUES ($1, $2, false, $3)`,
        [employee.EmployeeID, email, ipAddress]
      );
      return res.status(403).json({ error: 'Account suspended. Contact your administrator.' });
    }

    const passwordMatches = await bcrypt.compare(password, employee.PasswordHash);

    if (!passwordMatches) {
      const newAttempts = employee.FailedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

      await client.query(
        `UPDATE "Employee" SET "FailedLoginAttempts" = $1, "Status" = $2 WHERE "EmployeeID" = $3`,
        [newAttempts, shouldLock ? 'Locked' : employee.Status, employee.EmployeeID]
      );

      await client.query(
        `INSERT INTO "LoginAudit" ("EmployeeID", "Email", "Success", "IPAddress") VALUES ($1, $2, false, $3)`,
        [employee.EmployeeID, email, ipAddress]
      );

      if (shouldLock) {
        return res.status(403).json({ error: 'Too many failed attempts. Account has been locked.' });
      }
      return res.status(401).json({
        error: `Invalid email or password. ${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining before lockout.`
      });
    }

    // Success - reset failed attempts, update last login, log it
    await client.query(
      `UPDATE "Employee" SET "FailedLoginAttempts" = 0, "LastLogin" = NOW() WHERE "EmployeeID" = $1`,
      [employee.EmployeeID]
    );
    await client.query(
      `INSERT INTO "LoginAudit" ("EmployeeID", "Email", "Success", "IPAddress") VALUES ($1, $2, true, $3)`,
      [employee.EmployeeID, email, ipAddress]
    );

    const tokenPayload = {
      type: 'employee',
      employeeId: employee.EmployeeID,
      name: employee.Name,
      roleName: employee.RoleName,
      branchId: employee.BranchID
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    res.json({
      success: true,
      token,
      employee: {
        employeeId: employee.EmployeeID,
        name: employee.Name,
        email: employee.Email,
        role: employee.RoleName,
        branchId: employee.BranchID,
        branchName: employee.BranchName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// GET /api/auth/me - returns the logged-in employee's own profile
// Requires verifyToken middleware to have run first (req.employee is set)
exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         e."EmployeeID", e."Name", e."Email", r."RoleName", e."BranchID", b."BranchName", e."LastLogin"
       FROM "Employee" e
       JOIN "Role" r ON e."RoleID" = r."RoleID"
       LEFT JOIN "Branch" b ON e."BranchID" = b."BranchID"
       WHERE e."EmployeeID" = $1`,
      [req.employee.employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/auth/change-password - staff changes their own password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT "PasswordHash" FROM "Employee" WHERE "EmployeeID" = $1`,
      [req.employee.employeeId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const matches = await bcrypt.compare(currentPassword, rows[0].PasswordHash);
    if (!matches) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE "Employee" SET "PasswordHash" = $1 WHERE "EmployeeID" = $2`, [newHash, req.employee.employeeId]);

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "RecordID", "UserName", "Details")
       VALUES ('UPDATE', 'Employee', $1, $2, 'Password changed by user')`,
      [req.employee.employeeId, req.employee.name]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: error.message });
  }
};  
