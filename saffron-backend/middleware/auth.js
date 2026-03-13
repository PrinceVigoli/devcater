const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// ─── VERIFY JWT TOKEN ─────────────────────────────────────────────────────────

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (rows[0].status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ─── ADMIN ONLY GUARD ─────────────────────────────────────────────────────────

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ─── OPTIONAL AUTH (attach user if token present, don't fail if not) ──────────

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [rows] = await pool.execute(
        'SELECT id, name, email, role FROM users WHERE id = ?',
        [decoded.id]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) {}
  next();
};

module.exports = { verifyToken, adminOnly, optionalAuth };
