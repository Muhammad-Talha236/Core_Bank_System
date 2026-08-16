const pool = require('./db');

// Small in-memory cache so a setting lookup doesn't add a query to every
// single deposit/withdraw/transfer. Settings change rarely, so a short TTL
// keeps them close to real-time without touching the DB on the hot path.
const CACHE_TTL_MS = 30 * 1000;
let cache = { data: null, expiresAt: 0 };

async function loadAll() {
  const { rows } = await pool.query(`SELECT "SettingKey", "SettingValue" FROM "SystemSetting"`);
  const map = {};
  for (const row of rows) map[row.SettingKey] = row.SettingValue;
  return map;
}

async function getAllSettings() {
  if (cache.data && Date.now() < cache.expiresAt) return cache.data;
  const data = await loadAll();
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

// Returns a numeric setting, falling back to defaultValue if the row is
// missing or the DB is briefly unreachable - a settings lookup failing
// should never block a transaction from processing.
async function getNumberSetting(key, defaultValue) {
  try {
    const all = await getAllSettings();
    const raw = all[key];
    const parsed = raw !== undefined ? parseFloat(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : defaultValue;
  } catch (err) {
    console.error(`Settings lookup failed for ${key}, using default ${defaultValue}:`, err.message);
    return defaultValue;
  }
}

async function updateSetting(key, value) {
  const { rows } = await pool.query(
    `UPDATE "SystemSetting" SET "SettingValue" = $1, "UpdatedAt" = NOW() WHERE "SettingKey" = $2 RETURNING "SettingKey"`,
    [String(value), key]
  );
  cache = { data: null, expiresAt: 0 }; // invalidate immediately so the new value is picked up right away
  return rows.length > 0;
}

module.exports = { getAllSettings, getNumberSetting, updateSetting };