const pool = require('../../config/db');
const { updateSetting } = require('../../config/settings');

// Only these keys can be changed through the API - prevents someone from
// inserting arbitrary settings the rest of the app doesn't know about.
const EDITABLE_KEYS = ['APPROVAL_THRESHOLD', 'ONLINE_TRANSFER_LIMIT'];

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT "SettingKey", "SettingValue", "Description", "UpdatedAt" FROM "SystemSetting" ORDER BY "SettingKey"`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/settings/:key
exports.updateSettingValue = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!EDITABLE_KEYS.includes(key)) {
    return res.status(400).json({ error: `"${key}" is not an editable setting` });
  }
  if (value === undefined || value === null || isNaN(parseFloat(value)) || parseFloat(value) < 0) {
    return res.status(400).json({ error: 'value must be a non-negative number' });
  }

  try {
    const updated = await updateSetting(key, parseFloat(value));
    if (!updated) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("Operation", "TableAffected", "UserName", "Details")
       VALUES ('UPDATE', 'SystemSetting', $1, $2)`,
      [req.employee.name, `${key} changed to ${value} by ${req.employee.name}`]
    );

    res.json({ success: true, message: `${key} updated to ${value}` });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
};