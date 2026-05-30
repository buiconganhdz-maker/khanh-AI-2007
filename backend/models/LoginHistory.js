const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['login', 'logout', 'failed_login', 'token_refresh', 'password_change', 'register'],
    required: true
  },
  success: {
    type: Boolean,
    default: true
  },
  ip: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  device: {
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    type: { type: String, default: 'unknown' } // desktop, mobile, tablet
  },
  location: {
    type: String,
    default: ''
  },
  failReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-delete after 90 days
loginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
loginHistorySchema.index({ userId: 1, createdAt: -1 });

// Static: log an event
loginHistorySchema.statics.logEvent = async function(data) {
  try {
    return await this.create(data);
  } catch (err) {
    console.error('Login history log error:', err.message);
  }
};

// Parse user-agent into device info
loginHistorySchema.statics.parseUA = function(ua) {
  const info = { browser: '', os: '', type: 'desktop' };
  if (!ua) return info;

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) info.browser = 'Chrome';
  else if (ua.includes('Firefox')) info.browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) info.browser = 'Safari';
  else if (ua.includes('Edg')) info.browser = 'Edge';
  else info.browser = 'Other';

  // OS detection
  if (ua.includes('Windows')) info.os = 'Windows';
  else if (ua.includes('Mac OS')) info.os = 'macOS';
  else if (ua.includes('Linux')) info.os = 'Linux';
  else if (ua.includes('Android')) info.os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) info.os = 'iOS';
  else info.os = 'Other';

  // Device type
  if (ua.includes('Mobile') || ua.includes('Android')) info.type = 'mobile';
  else if (ua.includes('iPad') || ua.includes('Tablet')) info.type = 'tablet';
  else info.type = 'desktop';

  return info;
};

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
