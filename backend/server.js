require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const { csrfCookie, csrfProtection } = require('./middleware/csrf');

// Import routes
const authRoutes = require('./routes/auth');
const cameraRoutes = require('./routes/cameras');
const alertRoutes = require('./routes/alerts');
const detectionRoutes = require('./routes/detections');

// Import services
const { setupWebSocket } = require('./services/websocket');

// Import models for seeding
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, 'uploads', 'snapshots');
const avatarsDir = path.join(__dirname, 'uploads', 'avatars');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(avatarsDir, { recursive: true });

// ─── Middleware ──────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── CSRF Protection ────────────────────────────────────
app.use(csrfCookie);       // Set CSRF cookie on every request
app.use(csrfProtection);   // Validate CSRF on POST/PUT/PATCH/DELETE

// ─── Rate Limiting ──────────────────────────────────────

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for auth endpoints (anti-brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes
  message: { error: 'Too many auth requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

// Even stricter for login/register
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 attempts per 5 minutes
  message: { error: 'Too many login attempts. Wait 5 minutes.' },
  standardHeaders: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', loginLimiter);

// Static files for snapshots & avatars
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/detections', detectionRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket setup
setupWebSocket(io);

// ─── Seed default admin ─────────────────────────────────
async function seedAdmin() {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@aicamera.local',
        password_hash: 'admin123',
        role: 'admin',
        emailVerified: true // Pre-verified for seed admin
      });
      console.log('👤 Default admin user created (admin / admin123)');
    }
  } catch (error) {
    // If admin already exists with old schema, update it
    if (error.code === 11000) {
      console.log('👤 Admin user already exists');
    } else {
      console.error('Seed error:', error.message);
    }
  }
}

// ─── Connect & Start ────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('🗄️  MongoDB connected');
    await seedAdmin();

    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   🛡️  AI Camera Security Backend              ║
║   🚀 Server running on port ${PORT}               ║
║   🗄️  MongoDB Atlas connected                  ║
║   🔌 WebSocket ready                           ║
║   🔐 Auth: JWT + Refresh + HttpOnly Cookies    ║
║   🛡️  Security: Rate Limit + Helmet + CSRF     ║
╚════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
