const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const LoginHistory = require('../models/LoginHistory');
const { auth, getClientIP } = require('../middleware/auth');
const { sendOTPEmail, sendWelcomeEmail } = require('../services/otp');

// ─── Avatar Upload Config ─────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  }
});

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────

function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function setRefreshCookie(res, token, rememberMe) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/api/auth'
  });
}

function setAccessCookie(res, token) {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/'
  });
}

function clearAuthCookies(res) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.clearCookie('accessToken', { path: '/' });
}

// ═══════════════════════════════════════════════════════════
// GET /api/auth/csrf — Get CSRF cookie (frontend calls on init)
// ═══════════════════════════════════════════════════════════
router.get('/csrf', (req, res) => {
  // The csrfCookie middleware already sets the cookie.
  // This endpoint just confirms it.
  res.json({ csrf: true });
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/register — Create account + send OTP
// ═══════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Check existing
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
      return res.status(400).json({ error: 'Username already taken.' });
    }

    // Create user (unverified)
    const user = new User({
      username,
      email,
      password_hash: password,
      role: 'admin',
      emailVerified: false
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email (async, log fallback in dev)
    await sendOTPEmail(email, otp, username);

    // Log event
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    await LoginHistory.logEvent({
      userId: user._id,
      action: 'register',
      success: true,
      ip,
      userAgent: ua,
      device: LoginHistory.parseUA(ua)
    });

    res.status(201).json({
      message: 'Account created. Please verify your email with the OTP sent.',
      userId: user._id,
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/verify-otp — Verify email with OTP code
// ═══════════════════════════════════════════════════════════
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, email, code } = req.body;

    const user = await User.findOne(
      userId ? { _id: userId } : { email }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const result = user.verifyOTP(code);
    if (!result.valid) {
      await user.save();
      return res.status(400).json({ error: result.error });
    }

    await user.save();

    // Send welcome email
    sendWelcomeEmail(user.email, user.username).catch(() => {});

    // Auto-login after verification
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    const deviceInfo = LoginHistory.parseUA(ua);

    const accessToken = generateAccessToken(user._id);
    const refreshTokenDoc = await RefreshToken.createToken(user._id, {
      rememberMe: false,
      deviceInfo: { userAgent: ua, ...deviceInfo },
      ip
    });

    setRefreshCookie(res, refreshTokenDoc.token, false);
    setAccessCookie(res, accessToken);

    res.json({
      message: 'Email verified successfully!',
      user: user.toJSON(),
      accessToken,
      refreshToken: refreshTokenDoc.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/resend-otp — Resend OTP code
// ═══════════════════════════════════════════════════════════
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId, email } = req.body;

    const user = await User.findOne(
      userId ? { _id: userId } : { email }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified.' });
    }

    const otp = user.generateOTP();
    await user.save();

    await sendOTPEmail(user.email, otp, user.username);

    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/login — Login with access + refresh tokens
// ═══════════════════════════════════════════════════════════
router.post('/login', async (req, res) => {
  try {
    const { username, password, rememberMe = false } = req.body;
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    const deviceInfo = LoginHistory.parseUA(ua);

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      await LoginHistory.logEvent({
        userId: null,
        action: 'failed_login',
        success: false,
        ip, userAgent: ua,
        device: deviceInfo,
        failReason: 'User not found'
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Check account lock
    if (user.isLocked()) {
      const unlockIn = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      await LoginHistory.logEvent({
        userId: user._id,
        action: 'failed_login',
        success: false,
        ip, userAgent: ua,
        device: deviceInfo,
        failReason: 'Account locked'
      });
      return res.status(423).json({
        error: `Account locked. Try again in ${unlockIn} minute(s).`,
        lockedUntil: user.lockedUntil
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.handleFailedLogin();
      await LoginHistory.logEvent({
        userId: user._id,
        action: 'failed_login',
        success: false,
        ip, userAgent: ua,
        device: deviceInfo,
        failReason: 'Wrong password'
      });

      const remaining = 5 - user.failedLoginAttempts;
      return res.status(401).json({
        error: remaining > 0
          ? `Invalid credentials. ${remaining} attempt(s) remaining.`
          : 'Account locked for 15 minutes.'
      });
    }

    // Check email verification
    if (!user.emailVerified) {
      // Resend OTP automatically
      const otp = user.generateOTP();
      await user.save();
      await sendOTPEmail(user.email, otp, user.username);

      return res.status(403).json({
        error: 'Email not verified. A new OTP has been sent.',
        requiresVerification: true,
        userId: user._id,
        email: user.email
      });
    }

    // ── Success ─────────────────────────────────────────
    await user.handleSuccessfulLogin(ip);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshTokenDoc = await RefreshToken.createToken(user._id, {
      rememberMe,
      deviceInfo: { userAgent: ua, ...deviceInfo },
      ip
    });

    // Set HttpOnly cookies
    setRefreshCookie(res, refreshTokenDoc.token, rememberMe);
    setAccessCookie(res, accessToken);

    // Log event
    await LoginHistory.logEvent({
      userId: user._id,
      action: 'login',
      success: true,
      ip, userAgent: ua,
      device: deviceInfo
    });

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken: refreshTokenDoc.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/refresh — Rotate refresh token
// ═══════════════════════════════════════════════════════════
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const oldToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!oldToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    // Rotate token (revoke old, create new)
    const newTokenDoc = await RefreshToken.rotateToken(oldToken);

    if (!newTokenDoc) {
      clearAuthCookies(res);
      return res.status(401).json({
        error: 'Invalid or expired refresh token. Please login again.',
        code: 'REFRESH_REVOKED'
      });
    }

    // Generate new access token
    const accessToken = generateAccessToken(newTokenDoc.userId);

    // Set new cookies
    setRefreshCookie(res, newTokenDoc.token, newTokenDoc.rememberMe);
    setAccessCookie(res, accessToken);

    // Log
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    await LoginHistory.logEvent({
      userId: newTokenDoc.userId,
      action: 'token_refresh',
      success: true,
      ip, userAgent: ua,
      device: LoginHistory.parseUA(ua)
    });

    res.json({
      accessToken,
      refreshToken: newTokenDoc.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/logout — Revoke refresh token
// ═══════════════════════════════════════════════════════════
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (token) {
      const rt = await RefreshToken.findOne({ token });
      if (rt) {
        rt.isRevoked = true;
        await rt.save();
      }
    }

    clearAuthCookies(res);

    // Log event
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    let userId = null;
    try {
      const accessToken = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.accessToken;
      if (accessToken) {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET, { ignoreExpiration: true });
        userId = decoded.userId;
      }
    } catch (e) {}

    if (userId) {
      await LoginHistory.logEvent({
        userId,
        action: 'logout',
        success: true,
        ip, userAgent: ua,
        device: LoginHistory.parseUA(ua)
      });
    }

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/logout-all — Revoke ALL refresh tokens
// ═══════════════════════════════════════════════════════════
router.post('/logout-all', auth, async (req, res) => {
  try {
    await RefreshToken.revokeAllForUser(req.userId);
    clearAuthCookies(res);

    res.json({ message: 'All sessions logged out.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me — Get current user profile
// ═══════════════════════════════════════════════════════════
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

// ═══════════════════════════════════════════════════════════
// PUT /api/auth/change-password — Change password
// ═══════════════════════════════════════════════════════════
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    req.user.password_hash = newPassword;
    await req.user.save();

    // Revoke all refresh tokens (force re-login)
    await RefreshToken.revokeAllForUser(req.userId);

    // Log
    const ip = getClientIP(req);
    const ua = req.headers['user-agent'] || '';
    await LoginHistory.logEvent({
      userId: req.userId,
      action: 'password_change',
      success: true,
      ip, userAgent: ua,
      device: LoginHistory.parseUA(ua)
    });

    // Issue new tokens
    const accessToken = generateAccessToken(req.userId);
    const refreshTokenDoc = await RefreshToken.createToken(req.userId, {
      deviceInfo: { userAgent: ua },
      ip
    });

    setRefreshCookie(res, refreshTokenDoc.token, false);
    setAccessCookie(res, accessToken);

    res.json({
      message: 'Password changed. All other sessions logged out.',
      accessToken,
      refreshToken: refreshTokenDoc.token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/sessions — Get active sessions
// ═══════════════════════════════════════════════════════════
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await RefreshToken.getActiveSessions(req.userId);
    res.json({
      sessions: sessions.map(s => ({
        id: s._id,
        device: s.deviceInfo,
        ip: s.ip,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        rememberMe: s.rememberMe
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/auth/sessions/:id — Revoke specific session
// ═══════════════════════════════════════════════════════════
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await RefreshToken.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    session.isRevoked = true;
    await session.save();

    res.json({ message: 'Session revoked.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/login-history — Get login history
// ═══════════════════════════════════════════════════════════
router.get('/login-history', auth, async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const total = await LoginHistory.countDocuments({ userId: req.userId });
    const history = await LoginHistory.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      history,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// PUT /api/auth/avatar — Upload user avatar
// ═══════════════════════════════════════════════════════════
router.put('/avatar', auth, (req, res) => {
  avatarUpload.single('avatar')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Max 2MB.' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
      // Delete old avatar file if exists
      if (req.user.avatar) {
        const oldPath = path.join(__dirname, '..', req.user.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Update user avatar path
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      req.user.avatar = avatarUrl;
      await req.user.save();

      res.json({
        message: 'Avatar updated.',
        avatar: avatarUrl
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

module.exports = router;
