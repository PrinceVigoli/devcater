const { pool } = require('../config/db');
const { sendOrderConfirmation } = require('../config/mailer');

// ─── HELPER ───────────────────────────────────────────────────────────────────

const generateOrderRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'ORD';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// ─── PLACE ORDER ──────────────────────────────────────────────────────────────

/**
 * POST /api/orders
 * Body: { name, email, event_date?, delivery_location?, special_notes?, items[], booking_id? }
 * items: [{ menu_item_id, quantity }]
 */
const placeOrder = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { name, email, event_date, delivery_location, special_notes, items, booking_id } = req.body;

    // Validate required fields
    if (!name || !email) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'At least one menu item is required' });
    }

    // Validate and price each item
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.menu_item_id || !item.quantity || item.quantity < 1) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Each item needs a valid menu_item_id and quantity' });
      }

      const [rows] = await conn.execute(
        "SELECT id, name, price, status FROM menu_items WHERE id = ?",
        [item.menu_item_id]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Menu item #${item.menu_item_id} not found` });
      }

      if (rows[0].status !== 'active') {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `"${rows[0].name}" is currently unavailable` });
      }

      const qty = parseInt(item.quantity);
      const itemSubtotal = parseFloat(rows[0].price) * qty;
      subtotal += itemSubtotal;

      validatedItems.push({
        menu_item_id: rows[0].id,
        name: rows[0].name,
        price: parseFloat(rows[0].price),
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    // Calculate tax and total
    const TAX_RATE = 0.10; // 10%
    const tax   = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order_ref = generateOrderRef();
    const user_id   = req.user?.id || null;

    // Insert order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders
         (order_ref, user_id, booking_id, name, email, event_date,
          delivery_location, special_notes, subtotal, tax, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        order_ref, user_id, booking_id || null,
        name.trim(), email.toLowerCase(),
        event_date || null, delivery_location || null, special_notes || null,
        subtotal, tax, total,
      ]
    );

    const order_id = orderResult.insertId;

    // Insert order line items
    for (const item of validatedItems) {
      await conn.execute(
        `INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, item.menu_item_id, item.name, item.price, item.quantity, item.subtotal]
      );
    }

    await conn.commit();

    // Send confirmation email (non-blocking)
    sendOrderConfirmation({ id: order_id, order_ref, name, email, event_date, total })
      .catch((err) => console.error('Order email failed:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order_ref,
      order_id,
      subtotal,
      tax,
      total,
      item_count: validatedItems.length,
    });
  } catch (err) {
    await conn.rollback();
    console.error('PlaceOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to place order' });
  } finally {
    conn.release();
  }
};

// ─── GET MY ORDERS (Authenticated User) ──────────────────────────────────────

/**
 * GET /api/orders/my
 * Requires: Bearer token
 */
const getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Attach line items to each order
    for (const order of orders) {
      const [items] = await pool.execute(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }

    return res.json({ success: true, data: orders, total: orders.length });
  } catch (err) {
    console.error('GetMyOrders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch your orders' });
  }
};

// ─── GET ALL ORDERS (Admin) ───────────────────────────────────────────────────

/**
 * GET /api/orders
 * Query: { status?, search?, page?, limit? }
 * Requires: Admin Bearer token
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND o.status = ?'; params.push(status); }
    if (search) {
      query += ' AND (o.name LIKE ? OR o.order_ref LIKE ? OR o.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY o.created_at DESC';
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(query, params);

    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM orders');

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllOrders error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────

/**
 * GET /api/orders/:id
 * Requires: Bearer token (user sees own, admin sees all)
 */
const getOrderById = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = rows[0];

    // Non-admins can only view their own orders
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Attach line items
    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [order.id]
    );
    order.items = items;

    return res.json({ success: true, data: order });
  } catch (err) {
    console.error('GetOrderById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order' });
  }
};

// ─── UPDATE ORDER STATUS (Admin) ─────────────────────────────────────────────

/**
 * PUT /api/orders/:id/status
 * Body: { status }
 * Requires: Admin Bearer token
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const [existing] = await pool.execute('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await pool.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, req.params.id]
    );

    return res.json({ success: true, message: `Order status updated to "${status}"` });
  } catch (err) {
    console.error('UpdateOrderStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update order status' });
  }
};

// ─── CANCEL ORDER (User) ──────────────────────────────────────────────────────

/**
 * PUT /api/orders/:id/cancel
 * Requires: Bearer token (only pending orders can be cancelled)
 */
const cancelOrder = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = rows[0];

    // Ownership check
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status "${order.status}"`,
      });
    }

    await pool.execute(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );

    return res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('CancelOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// ─── DELETE ORDER (Admin) ─────────────────────────────────────────────────────

/**
 * DELETE /api/orders/:id
 * Requires: Admin Bearer token
 */
const deleteOrder = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM orders WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // order_items are deleted via CASCADE
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);

    return res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('DeleteOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete order' });
  }
};

// ─── ORDER STATS (Admin) ──────────────────────────────────────────────────────

/**
 * GET /api/orders/stats
 * Requires: Admin Bearer token
 */
const getOrderStats = async (req, res) => {
  try {
    const [summary] = await pool.execute(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        SUM(total) as total_revenue,
        AVG(total) as avg_order_value
      FROM orders
    `);

    const [topItems] = await pool.execute(`
      SELECT oi.name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      GROUP BY oi.name
      ORDER BY total_qty DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: { summary: summary[0], top_items: topItems },
    });
  } catch (err) {
    console.error('GetOrderStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch order stats' });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStats,
};