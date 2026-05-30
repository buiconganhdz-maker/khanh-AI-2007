const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  tokenFamily: {
    type: String,
    required: true
  },
  // ─── Device & Session Info ────────────────────────────
  deviceInfo: {
    userAgent: { type: String, default: '' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    device: { type: String, default: 'unknown' }
  },
  ip: {
    type: String,
    default: ''
  },
  // ─── Token Lifecycle ──────────────────────────────────
  isRevoked: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  },
  rememberMe: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Auto-delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ tokenFamily: 1 });

// Generate a secure random token
refreshTokenSchema.statics.generateToken = function() {
  return crypto.randomBytes(64).toString('hex');
};

// Generate a token family ID (for rotation tracking)
refreshTokenSchema.statics.generateFamily = function() {
  return crypto.randomBytes(16).toString('hex');
};

// Create a new refresh token
refreshTokenSchema.statics.createToken = async function(userId, options = {}) {
  const { rememberMe = false, deviceInfo = {}, ip = '', tokenFamily = null } = options;

  const token = this.generateToken();
  const family = tokenFamily || this.generateFamily();

  // Expiry: 30 days for remember me, 24 hours otherwise
  const expiresAt = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

  const refreshToken = await this.create({
    userId,
    token,
    tokenFamily: family,
    deviceInfo,
    ip,
    expiresAt,
    rememberMe
  });

  return refreshToken;
};

// Rotate token (revoke old, create new in same family)
refreshTokenSchema.statics.rotateToken = async function(oldToken) {
  const existing = await this.findOne({ token: oldToken, isRevoked: false });

  if (!existing) {
    // Token reuse detected! Revoke entire family
    const reused = await this.findOne({ token: oldToken });
    if (reused) {
      await this.updateMany(
        { tokenFamily: reused.tokenFamily },
        { isRevoked: true }
      );
      console.warn(`🚨 Refresh token reuse detected for family ${reused.tokenFamily}! All tokens revoked.`);
    }
    return null;
  }

  // Check expiry
  if (existing.expiresAt < new Date()) {
    existing.isRevoked = true;
    await existing.save();
    return null;
  }

  // Revoke old token
  existing.isRevoked = true;
  existing.usedAt = new Date();
  await existing.save();

  // Create new token in same family
  const newToken = await this.createToken(existing.userId, {
    rememberMe: existing.rememberMe,
    deviceInfo: existing.deviceInfo,
    ip: existing.ip,
    tokenFamily: existing.tokenFamily
  });

  return newToken;
};

// Revoke all tokens for a user
refreshTokenSchema.statics.revokeAllForUser = async function(userId) {
  return this.updateMany({ userId, isRevoked: false }, { isRevoked: true });
};

// Get active sessions for a user
refreshTokenSchema.statics.getActiveSessions = async function(userId) {
  return this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
