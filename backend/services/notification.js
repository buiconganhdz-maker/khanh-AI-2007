const nodemailer = require('nodemailer');

// Email transporter (lazy init)
let emailTransporter = null;

function getEmailTransporter() {
  if (!emailTransporter && process.env.SMTP_USER) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return emailTransporter;
}

async function sendEmailNotification(alert, camera) {
  const transporter = getEmailTransporter();
  if (!transporter) return;

  const severityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };

  const subject = `${severityEmoji[alert.severity] || '⚠️'} [${alert.severity.toUpperCase()}] ${alert.alertType} - ${camera.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 10px;">
        <h2 style="color: #00d4ff;">🛡️ AI Camera Security Alert</h2>
        <table style="width: 100%; color: #ccc;">
          <tr><td><strong>Camera:</strong></td><td>${camera.name}</td></tr>
          <tr><td><strong>Location:</strong></td><td>${camera.location}</td></tr>
          <tr><td><strong>Alert Type:</strong></td><td>${alert.alertType}</td></tr>
          <tr><td><strong>Severity:</strong></td><td>${alert.severity}</td></tr>
          <tr><td><strong>Confidence:</strong></td><td>${(alert.confidence * 100).toFixed(1)}%</td></tr>
          <tr><td><strong>Time:</strong></td><td>${new Date(alert.createdAt).toLocaleString()}</td></tr>
        </table>
        ${alert.objects?.length ? `<p style="color: #ccc;">Objects detected: ${alert.objects.map(o => o.name).join(', ')}</p>` : ''}
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self for now
      subject,
      html
    });
    console.log('📧 Email notification sent');
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }
}

async function sendTelegramNotification(alert, camera) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const severityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴'
  };

  const message = `
${severityEmoji[alert.severity] || '⚠️'} *AI Camera Alert*

📹 *Camera:* ${camera.name}
📍 *Location:* ${camera.location}
🚨 *Type:* ${alert.alertType}
⚡ *Severity:* ${alert.severity}
🎯 *Confidence:* ${(alert.confidence * 100).toFixed(1)}%
🕐 *Time:* ${new Date(alert.createdAt).toLocaleString()}
${alert.objects?.length ? `🔍 *Objects:* ${alert.objects.map(o => o.name).join(', ')}` : ''}
  `.trim();

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (response.ok) {
      console.log('📱 Telegram notification sent');
    }
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
  }
}

async function sendNotification(alert, camera) {
  await Promise.allSettled([
    sendEmailNotification(alert, camera),
    sendTelegramNotification(alert, camera)
  ]);
}

module.exports = { sendNotification, sendEmailNotification, sendTelegramNotification };
