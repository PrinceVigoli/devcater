const { pool } = require('../config/db');

// ─── GET ALL CUSTOMERS (Admin) ────────────────────────────────────────────────

/**
 * GET /api/customers
 * Query: { status?, search?, page?, limit? }
 * Requires: Admin Bearer token
 */
const getAllCustomers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT
        u.id, u.name, u.email, u.phone, u.status, u.avatar, u.created_at,
        COUNT(DISTINCT b.id)                                       AS booking_count,
        COUNT(DISTINCT o.id)                                       AS order_count,
        COALESCE(SUM(CASE WHEN p.status='completed' THEN p.amount END), 0) AS total_spent
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN orders   o ON u.id = o.user_id
      LEFT JOIN payments p ON u.id = p.user_id
      WHERE u.role = 'customer'
    `;
    const params = [];

    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    const [countRows] = await pool.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'customer'"
    );

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllCustomers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};

// ─── GET SINGLE CUSTOMER (Admin) ─────────────────────────────────────────────

/**
 * GET /api/customers/:id
 * Requires: Admin Bearer token
 */
const getCustomerById = async (req, res) => {
  try {
    const [user] = await pool.execute(
      "SELECT id, name, email, phone, status, avatar, created_at FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );

    return res.json({
      success: true,
      data: { ...user[0], bookings, orders, payments },
    });
  } catch (err) {
    console.error('GetCustomerById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer' });
  }
};

// ─── UPDATE CUSTOMER STATUS (Admin) ──────────────────────────────────────────

/**
 * PUT /api/customers/:id/status
 * Body: { status: 'active' | 'suspended' }
 * Requires: Admin Bearer token
 */
const updateCustomerStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be "active" or "suspended"' });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await pool.execute(
      'UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );

    return res.json({
      success: true,
      message: `Customer account ${status === 'active' ? 'activated' : 'suspended'} successfully`,
    });
  } catch (err) {
    console.error('UpdateCustomerStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update customer status' });
  }
};

// ─── DASHBOARD STATS (Admin) ──────────────────────────────────────────────────

/**
 * GET /api/customers/stats/dashboard
 * Requires: Admin Bearer token
 */
const getDashboardStats = async (req, res) => {
  try {
    const [[bookingStats]] = await pool.execute(`
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'rejected'  THEN 1 END) as rejected_bookings
      FROM bookings
    `);

    const [[orderStats]] = await pool.execute(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
      FROM orders
    `);

    const [[customerStats]] = await pool.execute(`
      SELECT
        COUNT(*) as total_customers,
        COUNT(CASE WHEN status = 'active'    THEN 1 END) as active_customers,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_customers
      FROM users WHERE role = 'customer'
    `);

    const [[revenueStats]] = await pool.execute(`
      SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending'   THEN amount END), 0) as pending_revenue,
        COUNT(*) as total_transactions
      FROM payments
    `);

    const [monthlyBookings] = await pool.execute(`
      SELECT
        MONTH(created_at) as month,
        YEAR(created_at)  as year,
        COUNT(*) as count
      FROM bookings
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year ASC, month ASC
    `);

    const [recentBookings] = await pool.execute(`
      SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        ...bookingStats,
        ...orderStats,
        ...customerStats,
        ...revenueStats,
        monthlyBookings,
        recentBookings,
      },
    });
  } catch (err) {
    console.error('GetDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// ─── DELETE CUSTOMER (Admin) ──────────────────────────────────────────────────

/**
 * DELETE /api/customers/:id
 * Requires: Admin Bearer token
 */
const deleteCustomer = async (req, res) => {
  try {
    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'customer'",
      [req.params.id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [req.params.id]);

    return res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('DeleteCustomer error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete customer' });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  getDashboardStats,
  deleteCustomer,
};
