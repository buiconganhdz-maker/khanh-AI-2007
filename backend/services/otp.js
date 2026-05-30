const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Send OTP verification email.
 */
async function sendOTPEmail(email, otp, username) {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [DEV MODE] OTP for ${email}: ${otp}`);
    return true; // In dev, just log it
  }

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%); padding: 40px 30px; border-radius: 16px; text-align: center;">
        <div style="background: linear-gradient(135deg, #00d4ff, #8b5cf6); width: 60px; height: 60px; border-radius: 14px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 28px; color: white;">🛡️</span>
        </div>
        <h1 style="color: #00d4ff; margin: 0 0 8px; font-size: 22px;">Email Verification</h1>
        <p style="color: #8888aa; margin: 0 0 30px; font-size: 14px;">AI Camera Security System</p>
        
        <p style="color: #ccc; font-size: 14px; margin-bottom: 10px;">Hello <strong style="color: #e8e8f0;">${username}</strong>,</p>
        <p style="color: #8888aa; font-size: 14px; margin-bottom: 25px;">Your verification code is:</p>
        
        <div style="background: rgba(0, 212, 255, 0.1); border: 2px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #00d4ff;">${otp}</span>
        </div>
        
        <p style="color: #555577; font-size: 12px; margin: 0;">
          This code expires in <strong style="color: #eab308;">10 minutes</strong>.<br/>
          If you didn't request this, please ignore this email.
        </p>
      </div>
    </div>
  `;

  try {
    await t.sendMail({
      from: `"AI Camera Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `🔐 Your verification code: ${otp}`,
      html
    });
    console.log(`📧 OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('OTP email error:', error.message);
    // Fallback: log to console in dev
    console.log(`📧 [FALLBACK] OTP for ${email}: ${otp}`);
    return true;
  }
}

/**
 * Send welcome email after verification.
 */
async function sendWelcomeEmail(email, username) {
  const t = getTransporter();
  if (!t) return;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%); padding: 40px 30px; border-radius: 16px; text-align: center;">
        <h1 style="color: #22c55e; margin: 0 0 15px;">✅ Welcome!</h1>
        <p style="color: #ccc; font-size: 14px;">
          Hello <strong>${username}</strong>, your email has been verified.<br/>
          You can now access the AI Camera Security Dashboard.
        </p>
      </div>
    </div>
  `;

  try {
    await t.sendMail({
      from: `"AI Camera Security" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: '✅ Email Verified — AI Camera Security',
      html
    });
  } catch (error) {
    console.error('Welcome email error:', error.message);
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
