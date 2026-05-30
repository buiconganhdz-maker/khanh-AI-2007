const crypto = require('crypto');

/**
 * CSRF Protection — Double Submit Cookie Pattern
 *
 * How it works:
 * 1. Server sets a `csrf-token` cookie (readable by JS, NOT HttpOnly)
 * 2. Frontend reads this cookie and sends it as `X-CSRF-Token` header
 * 3. Server compares cookie value vs header value on state-changing requests
 *
 * This prevents CSRF because:
 * - An attacker's site can trigger cookies to be SENT, but cannot READ them
 * - So the attacker can't set the X-CSRF-Token header to match
 */

// Endpoints that don't need CSRF validation (pre-auth or safe)
const CSRF_SKIP_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/refresh',
  '/api/auth/csrf',
];

// Only validate on state-changing methods
const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Middleware: Set CSRF cookie if not present.
 */
function csrfCookie(req, res, next) {
  if (!req.cookies['csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false,       // Must be readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
  }
  next();
}

/**
 * Middleware: Validate CSRF token on state-changing requests.
 */
function csrfProtection(req, res, next) {
  // Skip safe methods (GET, HEAD, OPTIONS)
  if (!CSRF_METHODS.includes(req.method)) {
    return next();
  }

  // Skip pre-auth endpoints
  const path = req.path || req.url;
  if (CSRF_SKIP_PATHS.some(skip => path.startsWith(skip) || path === skip)) {
    return next();
  }

  // Skip API-key authenticated requests (internal services)
  if (req.headers['x-api-key']) {
    return next();
  }

  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      error: 'CSRF token missing. Please refresh the page.',
      code: 'CSRF_MISSING'
    });
  }

  // Constant-time comparison to prevent timing attacks
  if (!safeCompare(cookieToken, headerToken)) {
    return res.status(403).json({
      error: 'CSRF token invalid. Please refresh the page.',
      code: 'CSRF_INVALID'
    });
  }

  next();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

module.exports = { csrfCookie, csrfProtection };
