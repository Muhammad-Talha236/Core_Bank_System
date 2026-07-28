// One-time setup script: creates the first SuperAdmin employee account.
// Run from the Backend folder like this:
//   node scripts/createSuperAdmin.js "Full Name" "email@example.com" "YourStrongPassword123"
//
// This is a script, not an API endpoint, on purpose - you should never expose
// "create a SuperAdmin" as a public HTTP route. Once this first account exists,
// all future employees (including other SuperAdmins) get created through the
// SuperAdmin panel in the app itself, protected by login + role checks.

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/connection');

async function createSuperAdmin() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.error('Usage: node scripts/createSuperAdmin.js "Full Name" "email@example.com" "Password123"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // Find the SuperAdmin role
    const roleResult = await client.query(
      `SELECT "RoleID" FROM "Role" WHERE "RoleName" = 'SuperAdmin'`
    );
    if (roleResult.rows.length === 0) {
      throw new Error('SuperAdmin role not found - did you run foundation_schema.sql?');
    }
    const roleId = roleResult.rows[0].RoleID;

    // Find the first branch (Main Branch, seeded earlier)
    const branchResult = await client.query(`SELECT "BranchID" FROM "Branch" ORDER BY "BranchID" LIMIT 1`);
    if (branchResult.rows.length === 0) {
      throw new Error('No branch found - did you run foundation_schema.sql?');
    }
    const branchId = branchResult.rows[0].BranchID;

    // Check if this email is already used
    const existing = await client.query(`SELECT "EmployeeID" FROM "Employee" WHERE "Email" = $1`, [email]);
    if (existing.rows.length > 0) {
      throw new Error(`An employee with email ${email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await client.query(
      `INSERT INTO "Employee" ("Name", "Email", "PasswordHash", "RoleID", "BranchID", "Status")
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING "EmployeeID"`,
      [name, email, passwordHash, roleId, branchId]
    );

    console.log('✅ SuperAdmin account created successfully!');
    console.log(`   EmployeeID: ${result.rows[0].EmployeeID}`);
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log('   You can now log in via POST /api/auth/login');
  } catch (err) {
    console.error('❌ Failed to create SuperAdmin:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createSuperAdmin();