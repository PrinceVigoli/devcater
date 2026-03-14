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

// ─── HEALTH CHECK FIRST ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Saffron API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Trust Railway/Heroku/Vercel proxy (fixes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return callback(null, true);

    const allowed = [
      process.env.FRONTEND_URL,           // e.g. https://devcater.vercel.app
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);

    // Allow any vercel.app preview URL for this project
    const isVercelPreview = origin.includes('vercel.app');

    if (allowed.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    console.error('CORS blocked:', origin);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// ─── 404 & ERROR ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── START SERVER FIRST, THEN CONNECT DB ─────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍊 Saffron API listening on port ${PORT}`);
  console.log(`📋 Environment : ${process.env.NODE_ENV || 'development'}\n`);

  testConnection().catch((err) => {
    console.error('DB connection error:', err.message);
  });
});