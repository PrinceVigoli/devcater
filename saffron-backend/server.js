const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const bookingRoutes = require('./routes/bookings');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const customerRoutes = require('./routes/customers');
const galleryRoutes = require('./routes/gallery');
const blogRoutes = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/blog', blogRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Saffron API is running', timestamp: new Date() });
});

// ─── 404 & ERROR HANDLERS ─────────────────────────────────────────────────────

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
  app.listen(PORT, () => {
    console.log(`\n🍊 Saffron API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${process.env.DB_NAME}\n`);
  });
})();
