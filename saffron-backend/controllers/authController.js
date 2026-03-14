const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { sendWelcomeEmail } = require('../config/mailer');

// ─── HELPER ───────────────────────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ─── REGISTER ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone? }
 */
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if email already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, 'customer']
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'customer',
    };

    // Generate token
    const token = generateToken(user);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user).catch((err) =>
      console.error('Welcome email failed:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Find user
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, status, avatar, phone FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = rows[0];

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    delete user.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// ─── GET MY PROFILE ───────────────────────────────────────────────────────────

/**
 * GET /api/auth/me
 * Requires: Bearer token
 */
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, status, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────

/**
 * PUT /api/auth/profile
 * Body: { name, phone }
 * Requires: Bearer token
 */
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), phone || null, req.user.id]
    );

    // Return updated user
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, role, status, avatar FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: rows[0],
    });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────

/**
 * PUT /api/auth/password
 * Body: { currentPassword, newPassword }
 * Requires: Bearer token
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Fetch stored password
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashed, req.user.id]
    );

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('ChangePassword error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// ─── UPDATE AVATAR ────────────────────────────────────────────────────────────

/**
 * PUT /api/auth/avatar
 * Requires: Bearer token + multipart image upload
 */
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    await pool.execute(
      'UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?',
      [avatarPath, req.user.id]
    );

    return res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: avatarPath,
    });
  } catch (err) {
    console.error('UpdateAvatar error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update avatar' });
  }
};

// ─── GET ALL USERS (Admin) ────────────────────────────────────────────────────

/**
 * GET /api/auth/users
 * Requires: Admin Bearer token
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    let query = 'SELECT id, name, email, phone, role, status, avatar, created_at FROM users WHERE 1=1';
    const params = [];

    if (role)   { query += ' AND role = ?';   params.push(role); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY created_at DESC';
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(query, params);

    // Total count
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE 1=1',
      []
    );

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// ─── DELETE USER (Admin) ──────────────────────────────────────────────────────

/**
 * DELETE /api/auth/users/:id
 * Requires: Admin Bearer token
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  updateAvatar,
  getAllUsers,
  deleteUser,
};