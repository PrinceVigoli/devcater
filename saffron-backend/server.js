const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

const authRoutes     = require('./routes/auth');
const menuRoutes     = require('./routes/menu');
const bookingRoutes  = require('./routes/bookings');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');
const customerRoutes = require('./routes/customers');
const galleryRoutes  = require('./routes/gallery');
const blogRoutes     = require('./routes/blog');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests from your frontend URL (Railway injects PORT, you set FRONTEND_URL)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
}));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/menu',      menuRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/gallery',   galleryRoutes);
app.use('/api/blog',      blogRoutes);

// Health check — Railway uses this to confirm the app is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Saffron API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

// ─── 404 & ERROR ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── START ────────────────────────────────────────────────────────────────────
(async () => {
  await testConnection();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🍊 Saffron API running on port ${PORT}`);
    console.log(`📋 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS allowed: ${allowedOrigins.join(', ')}\n`);
  });
})();
