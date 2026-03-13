const { pool } = require('../config/db');

const generatePayRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'PAY';
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// ─── CREATE PAYMENT RECORD ────────────────────────────────────────────────────

/**
 * POST /api/payments
 * Body: { order_id?, booking_id?, amount, method, transaction_id?, notes? }
 * Requires: Bearer token
 */
const createPayment = async (req, res) => {
  try {
    const { order_id, booking_id, amount, method, transaction_id, notes } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ success: false, message: 'Amount and payment method are required' });
    }

    const validMethods = ['paypal', 'credit_card', 'bank_transfer', 'cash'];
    if (!validMethods.includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }

    const payment_ref = generatePayRef();

    const [result] = await pool.execute(
      `INSERT INTO payments
         (payment_ref, order_id, booking_id, user_id, amount, method, transaction_id, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [payment_ref, order_id || null, booking_id || null, req.user.id, parseFloat(amount), method, transaction_id || null, notes || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment_ref,
      payment_id: result.insertId,
    });
  } catch (err) {
    console.error('CreatePayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record payment' });
  }
};

// ─── GET ALL PAYMENTS (Admin) ─────────────────────────────────────────────────

/**
 * GET /api/payments
 * Query: { status?, method?, page?, limit? }
 * Requires: Admin Bearer token
 */
const getAllPayments = async (req, res) => {
  try {
    const { status, method, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT p.*, u.name as customer_name, u.email as customer_email
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (method) { query += ' AND p.method = ?'; params.push(method); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    // Revenue summary
    const [stats] = await pool.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending'   THEN amount END), 0) as pending_amount,
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'failed'    THEN 1 END) as failed_count
      FROM payments
    `);

    return res.json({
      success: true,
      data: rows,
      stats: stats[0],
      total: rows.length,
    });
  } catch (err) {
    console.error('GetAllPayments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

// ─── GET MY PAYMENT HISTORY ───────────────────────────────────────────────────

/**
 * GET /api/payments/my
 * Requires: Bearer token
 */
const getMyPayments = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GetMyPayments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

// ─── UPDATE PAYMENT STATUS (Admin) ───────────────────────────────────────────

/**
 * PUT /api/payments/:id/status
 * Body: { status }
 * Requires: Admin Bearer token
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const [existing] = await pool.execute('SELECT id FROM payments WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const paid_at = status === 'completed' ? new Date() : null;

    await pool.execute(
      'UPDATE payments SET status = ?, paid_at = ? WHERE id = ?',
      [status, paid_at, req.params.id]
    );

    return res.json({ success: true, message: `Payment marked as "${status}"` });
  } catch (err) {
    console.error('UpdatePaymentStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};

// ─── GET SINGLE PAYMENT ───────────────────────────────────────────────────────

/**
 * GET /api/payments/:id
 * Requires: Bearer token
 */
const getPaymentById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.*, u.name as customer_name FROM payments p
       LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GetPaymentById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
};

module.exports = { createPayment, getAllPayments, getMyPayments, updatePaymentStatus, getPaymentById };
