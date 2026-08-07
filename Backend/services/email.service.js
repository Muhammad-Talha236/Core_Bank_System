const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendOtpEmail(toEmail, otpCode) {
  try {
    const mailOptions = {
      from: '"Meridian Bank Security" <no-reply@meridianbank.com>',
      to: toEmail,
      subject: 'Your Login Verification Code (OTP)',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #F6F4EF; border-radius: 5px;">
          <h2 style="color: #0B1F3A;">Meridian Bank Security</h2>
          <p>You have requested to sign in to your Online Banking account.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #C9A227; font-size: 36px; letter-spacing: 5px;">${otpCode}</h1>
          <p>This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
          <p style="font-size: 12px; color: #5B6472; margin-top: 30px;">If you did not attempt this login, please contact your branch immediately.</p>
        </div>
      `
    };

    // Agar environment variables set nahi hain development ke waqt, toh console par fallback print karein taaki testing na ruke
    if (!process.env.SMTP_USER) {
      console.log(`[EMAIL DEV FALLBACK] To: ${toEmail} | OTP Code: ${otpCode}`);
      return true;
    }

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email dispatch error:', error);
    throw new Error('Failed to send verification email.');
  }
}

module.exports = { sendOtpEmail };