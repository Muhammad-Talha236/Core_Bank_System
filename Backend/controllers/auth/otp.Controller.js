const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate and send OTP (For email/SMS simulation or production gateway)
exports.sendOtp = async (req, res) => {
  const { identifier, purpose } = req.body; // identifier = email or phone

  if (!identifier || !purpose) {
    return res.status(400).json({ success: false, error: 'Identifier and purpose are required' });
  }

  // 6-digit random OTP generate karna
  const rawCode = crypto.randomInt(100000, 999999).toString();
  const codeHash = await bcrypt.hash(rawCode, 10);
  
  // Expiry time: 5 minutes from now
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  try {
    // Purane unused OTPs invalidate kar do us identifier ke liye
    await pool.query(
      `UPDATE "OtpCode" SET "IsUsed" = TRUE WHERE "Identifier" = $1 AND "Purpose" = $2 AND "IsUsed" = FALSE`,
      [identifier, purpose]
    );

    // Naya OTP store karo
    await pool.query(
      `INSERT INTO "OtpCode" ("Identifier", "CodeHash", "Purpose", "ExpiresAt") VALUES ($1, $2, $3, $4)`,
      [identifier, codeHash, purpose, expiresAt]
    );

    // Real environment mein yahan Nodemailer ya SMS API (Twilio) call hogi
    // Development/Testing ke liye console par print kar sakte hain ya response mein bhej sakte hain (production mein response me code nahi bheja jata)
    console.log(`[OTP DEBUG] Code for ${identifier} (${purpose}): ${rawCode}`);

    res.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Verify OTP Helper function (jo login ya transfer controllers use karenge)
exports.verifyOtpCode = async (identifier, code, purpose) => {
  const { rows } = await pool.query(
    `SELECT * FROM "OtpCode" 
     WHERE "Identifier" = $1 AND "Purpose" = $2 AND "IsUsed" = FALSE AND "ExpiresAt" > NOW() 
     ORDER BY "CreatedAt" DESC LIMIT 1`,
    [identifier, purpose]
  );

  if (rows.length === 0) {
    return { valid: false, error: 'Invalid or expired OTP' };
  }

  const otpRecord = rows[0];
  const match = await bcrypt.compare(code, otpRecord.CodeHash);

  if (!match) {
    return { valid: false, error: 'Incorrect OTP code' };
  }

  // OTP ko used mark kar do taaki dobara use na ho sake (Single-use security)
  await pool.query(`UPDATE "OtpCode" SET "IsUsed" = TRUE WHERE "OtpID" = $1`, [otpRecord.OtpID]);

  return { valid: true };
};