const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'viewer'],
    default: 'admin'
  },
  avatar: {
    type: String,
    default: ''
  },

  // ─── Email Verification ──────────────────────────────
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: {
    code: { type: String, default: null },
    expiresAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 }
  },

  // ─── Account Security ────────────────────────────────
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: ''
  },

  // ─── Settings ─────────────────────────────────────────
  settings: {
    notifications: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: false },
    telegramAlerts: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  this.password_hash = await bcrypt.hash(this.password_hash, 12);
  this.passwordChangedAt = new Date();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  if (!this.lockedUntil) return false;
  return this.lockedUntil > new Date();
};

// Increment failed login and lock if needed
userSchema.methods.handleFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  // Lock after 5 failed attempts for 15 minutes
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await this.save();
};

// Reset failed login on success
userSchema.methods.handleSuccessfulLogin = async function(ip) {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  this.lastLoginAt = new Date();
  this.lastLoginIP = ip || '';
  await this.save();
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailOTP = {
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    attempts: 0
  };
  return code;
};

// Verify OTP
userSchema.methods.verifyOTP = function(code) {
  if (!this.emailOTP.code) return { valid: false, error: 'No OTP requested' };
  if (this.emailOTP.expiresAt < new Date()) return { valid: false, error: 'OTP expired' };
  if (this.emailOTP.attempts >= 5) return { valid: false, error: 'Too many attempts' };

  this.emailOTP.attempts += 1;

  if (this.emailOTP.code !== code) {
    return { valid: false, error: 'Invalid OTP' };
  }

  // Clear OTP on success
  this.emailOTP = { code: null, expiresAt: null, attempts: 0 };
  this.emailVerified = true;
  return { valid: true };
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.emailOTP;
  delete obj.failedLoginAttempts;
  delete obj.lockedUntil;
  return obj;
};

// Index for fast lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);
