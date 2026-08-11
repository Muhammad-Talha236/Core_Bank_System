const pool = require('../../config/db');

// Get all audit logs (most recent first, capped at 100)
exports.getAllAuditLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        al."LogID",
        al."Operation",
        al."TableAffected",
        al."RecordID",
        al."UserName",
        al."EmployeeID",
        al."CustomerID",
        al."DateTime" AS "CreatedAt",
        al."Details"
      FROM "AuditLog" al
      ORDER BY al."DateTime" DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
};