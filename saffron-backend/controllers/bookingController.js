const { pool } = require('../config/db');
const { sendBookingConfirmation, sendBookingStatusUpdate } = require('../config/mailer');

// ─── HELPER ───────────────────────────────────────────────────────────────────

const generateBookingRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = 'BK';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
};

// ─── SUBMIT BOOKING (Public / Optional Auth) ──────────────────────────────────

/**
 * POST /api/bookings
 * Body: { name, email, phone?, event_type, event_date, guest_count, message? }
 */
const submitBooking = async (req, res) => {
  try {
    const { name, email, phone, event_type, event_date, guest_count, message } = req.body;

    // Validate required fields
    if (!name || !email || !event_type || !event_date || !guest_count) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, event type, event date, and guest count are required',
      });
    }

    const validEventTypes = ['Wedding', 'Corporate Event', 'Birthday Party', 'Private Event', 'Other'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({ success: false, message: 'Invalid event type' });
    }

    if (parseInt(guest_count) < 1) {
      return res.status(400).json({ success: false, message: 'Guest count must be at least 1' });
    }

    // Check if event date is in the future
    if (new Date(event_date) <= new Date()) {
      return res.status(400).json({ success: false, message: 'Event date must be in the future' });
    }

    const booking_ref = generateBookingRef();
    const user_id = req.user?.id || null;

    const [result] = await pool.execute(
      `INSERT INTO bookings
         (booking_ref, user_id, name, email, phone, event_type, event_date, guest_count, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [booking_ref, user_id, name.trim(), email.toLowerCase(), phone || null, event_type, event_date, parseInt(guest_count), message || null]
    );

    const booking = {
      id: result.insertId,
      booking_ref,
      name,
      email,
      event_type,
      event_date,
      guest_count,
    };

    // Send confirmation email (non-blocking)
    sendBookingConfirmation(booking).catch((err) =>
      console.error('Booking email failed:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. We will contact you within 24 hours.',
      booking_ref,
      booking_id: result.insertId,
    });
  } catch (err) {
    console.error('SubmitBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit booking' });
  }
};

// ─── GET MY BOOKINGS (Authenticated User) ────────────────────────────────────

/**
 * GET /api/bookings/my
 * Requires: Bearer token
 */
const getMyBookings = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('GetMyBookings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch your bookings' });
  }
};

// ─── GET ALL BOOKINGS (Admin) ─────────────────────────────────────────────────

/**
 * GET /api/bookings
 * Query: { status?, search?, event_type?, page?, limit?, date_from?, date_to? }
 * Requires: Admin Bearer token
 */
const getAllBookings = async (req, res) => {
  try {
    const {
      status, search, event_type, page = 1, limit = 20,
      date_from, date_to, sort_by = 'created_at', sort_order = 'DESC',
    } = req.query;

    let query = `
      SELECT b.*, u.email as user_email, u.name as user_account_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND b.status = ?'; params.push(status); }
    if (event_type) { query += ' AND b.event_type = ?'; params.push(event_type); }
    if (date_from) { query += ' AND b.event_date >= ?'; params.push(date_from); }
    if (date_to)   { query += ' AND b.event_date <= ?'; params.push(date_to); }
    if (search) {
      query += ' AND (b.name LIKE ? OR b.booking_ref LIKE ? OR b.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Safe sort
    const allowedSorts = ['created_at', 'event_date', 'guest_count', 'total_amount'];
    const safeSort = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const safeOrder = sort_order === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY b.${safeSort} ${safeOrder}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    // Total count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM bookings WHERE 1=1
       ${status ? 'AND status = ?' : ''}`,
      status ? [status] : []
    );

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllBookings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

// ─── GET SINGLE BOOKING ───────────────────────────────────────────────────────

/**
 * GET /api/bookings/:id
 * Requires: Bearer token (user sees own, admin sees all)
 */
const getBookingById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = rows[0];

    // Non-admins can only see their own bookings
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.json({ success: true, data: booking });
  } catch (err) {
    console.error('GetBookingById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
};

// ─── UPDATE BOOKING STATUS (Admin) ───────────────────────────────────────────

/**
 * PUT /api/bookings/:id/status
 * Body: { status, assigned_team?, total_amount? }
 * Requires: Admin Bearer token
 */
const updateBookingStatus = async (req, res) => {
  try {
    const { status, assigned_team, total_amount } = req.body;
    const { id } = req.params;

    const validStatuses = ['pending', 'confirmed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const [existing] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await pool.execute(
      `UPDATE bookings
       SET status = ?, assigned_team = ?, total_amount = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, assigned_team || existing[0].assigned_team, total_amount || existing[0].total_amount, id]
    );

    // Send status update email for confirmed/rejected
    if (['confirmed', 'rejected'].includes(status)) {
      const [updated] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);
      sendBookingStatusUpdate(updated[0]).catch((err) =>
        console.error('Status email failed:', err.message)
      );
    }

    const [result] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: result[0],
    });
  } catch (err) {
    console.error('UpdateBookingStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
};

// ─── ASSIGN TEAM (Admin) ──────────────────────────────────────────────────────

/**
 * PUT /api/bookings/:id/assign
 * Body: { assigned_team }
 * Requires: Admin Bearer token
 */
const assignTeam = async (req, res) => {
  try {
    const { assigned_team } = req.body;
    if (!assigned_team) {
      return res.status(400).json({ success: false, message: 'assigned_team is required' });
    }

    await pool.execute(
      'UPDATE bookings SET assigned_team = ?, updated_at = NOW() WHERE id = ?',
      [assigned_team, req.params.id]
    );

    return res.json({ success: true, message: 'Team assigned successfully' });
  } catch (err) {
    console.error('AssignTeam error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign team' });
  }
};

// ─── DELETE BOOKING (Admin) ───────────────────────────────────────────────────

/**
 * DELETE /api/bookings/:id
 * Requires: Admin Bearer token
 */
const deleteBooking = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM bookings WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await pool.execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);

    return res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('DeleteBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete booking' });
  }
};

// ─── GET BOOKING STATS (Admin) ────────────────────────────────────────────────

/**
 * GET /api/bookings/stats
 * Requires: Admin Bearer token
 */
const getBookingStats = async (req, res) => {
  try {
    const [summary] = await pool.execute(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending'   THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'rejected'  THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        SUM(total_amount) as total_revenue,
        AVG(guest_count)  as avg_guests
      FROM bookings
    `);

    const [byEventType] = await pool.execute(`
      SELECT event_type, COUNT(*) as count
      FROM bookings
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const [monthly] = await pool.execute(`
      SELECT
        MONTH(created_at) as month,
        YEAR(created_at) as year,
        COUNT(*) as count
      FROM bookings
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year ASC, month ASC
    `);

    return res.json({
      success: true,
      data: {
        summary: summary[0],
        by_event_type: byEventType,
        monthly,
      },
    });
  } catch (err) {
    console.error('GetBookingStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch booking stats' });
  }
};

module.exports = {
  submitBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  assignTeam,
  deleteBooking,
  getBookingStats,
};
