const pool = require('../config/db');

async function checkIdempotency(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];

  // Agar request mein key nahi hai, toh normal flow chalne dein (backward compatibility)
  if (!idempotencyKey) {
    return next();
  }

  try {
    const { rows } = await pool.query(
      `SELECT "Response" FROM "IdempotencyKey" WHERE "Key" = $1`,
      [idempotencyKey]
    );

    if (rows.length > 0) {
      // Agar key pehle se processed hai, toh saved response return kar do
      return res.json(rows[0].Response);
    }

    // Response object ko intercept karke database mein save karne ke liye helper
    const originalJson = res.json;
    res.json = async function (body) {
      // Sirf successful responses ko cache karein
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await pool.query(
            `INSERT INTO "IdempotencyKey" ("Key", "Response") VALUES ($1, $2) ON CONFLICT ("Key") DO NOTHING`,
            [idempotencyKey, JSON.stringify(body)]
          );
        } catch (err) {
          console.error('Error saving idempotency key:', err);
        }
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    next();
  }
}

module.exports = { checkIdempotency };