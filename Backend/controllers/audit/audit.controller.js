const pool = require('../../config/db');

// Get all audit logs (most recent first, capped at 100)
exports.getAllAuditLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        "LogID",
        "Operation",
        "TableAffected",
        "RecordID",
        "UserName",
        "DateTime" AS "CreatedAt",
        "Details"
      FROM "AuditLog"
      ORDER BY "DateTime" DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
};
