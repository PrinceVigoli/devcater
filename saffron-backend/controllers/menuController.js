const fs = require('fs');
const { pool } = require('../config/db');

// ─── GET ALL MENU ITEMS ───────────────────────────────────────────────────────

/**
 * GET /api/menu
 * Query: { category?, status?, search?, page?, limit? }
 * Public
 */
const getAllMenuItems = async (req, res) => {
  try {
    const { category, status = 'active', search, page = 1, limit = 50 } = req.query;

    let query = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];

    if (status)   { query += ' AND status = ?';   params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search)   { query += ' AND name LIKE ?';  params.push(`%${search}%`); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY category ASC, name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.execute(query, params);

    // Count for pagination
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM menu_items WHERE 1=1
       ${status ? 'AND status = ?' : ''}
       ${category ? 'AND category = ?' : ''}`,
      [...(status ? [status] : []), ...(category ? [category] : [])]
    );

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllMenuItems error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
};

// ─── GET SINGLE MENU ITEM ─────────────────────────────────────────────────────

/**
 * GET /api/menu/:id
 * Public
 */
const getMenuItemById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GetMenuItemById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu item' });
  }
};

// ─── GET ITEMS BY CATEGORY ────────────────────────────────────────────────────

/**
 * GET /api/menu/category/:category
 * Public
 */
const getMenuByCategory = async (req, res) => {
  try {
    const validCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Catering Packages'];
    if (!validCategories.includes(req.params.category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM menu_items WHERE category = ? AND status = 'active' ORDER BY name ASC",
      [req.params.category]
    );

    return res.json({ success: true, data: rows, category: req.params.category });
  } catch (err) {
    console.error('GetMenuByCategory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch category items' });
  }
};

// ─── CREATE MENU ITEM (Admin) ─────────────────────────────────────────────────

/**
 * POST /api/menu
 * Body: { name, description, price, category, status? } + optional image file
 * Requires: Admin Bearer token
 */
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      // Clean up uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required',
      });
    }

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    const validCategories = ['Appetizers', 'Main Courses', 'Desserts', 'Beverages', 'Catering Packages'];
    if (!validCategories.includes(category)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }

    const imagePath = req.file ? `/uploads/menu/${req.file.filename}` : null;

    const [result] = await pool.execute(
      `INSERT INTO menu_items (name, description, price, category, image, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description || null,
        parseFloat(price),
        category,
        imagePath,
        status || 'active',
      ]
    );

    const [newItem] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: newItem[0],
    });
  } catch (err) {
    console.error('CreateMenuItem error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
};

// ─── UPDATE MENU ITEM (Admin) ─────────────────────────────────────────────────

/**
 * PUT /api/menu/:id
 * Body: { name?, description?, price?, category?, status? } + optional image file
 * Requires: Admin Bearer token
 */
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, status } = req.body;

    // Check item exists
    const [existing] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const currentItem = existing[0];

    // Handle image replacement
    let imagePath = currentItem.image;
    if (req.file) {
      // Delete old image file if it exists on disk
      if (currentItem.image) {
        const oldPath = `.${currentItem.image}`;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      imagePath = `/uploads/menu/${req.file.filename}`;
    }

    await pool.execute(
      `UPDATE menu_items
       SET name = ?, description = ?, price = ?, category = ?, image = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name || currentItem.name,
        description !== undefined ? description : currentItem.description,
        price ? parseFloat(price) : currentItem.price,
        category || currentItem.category,
        imagePath,
        status || currentItem.status,
        id,
      ]
    );

    const [updated] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updated[0],
    });
  } catch (err) {
    console.error('UpdateMenuItem error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
};

// ─── DELETE MENU ITEM (Admin) ─────────────────────────────────────────────────

/**
 * DELETE /api/menu/:id
 * Requires: Admin Bearer token
 */
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    // Remove image file from disk
    const item = existing[0];
    if (item.image) {
      const filePath = `.${item.image}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);

    return res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('DeleteMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
};

// ─── TOGGLE STATUS (Admin) ────────────────────────────────────────────────────

/**
 * PATCH /api/menu/:id/toggle
 * Requires: Admin Bearer token
 */
const toggleMenuItemStatus = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT status FROM menu_items WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
    await pool.execute(
      'UPDATE menu_items SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, req.params.id]
    );

    return res.json({
      success: true,
      message: `Menu item ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
      status: newStatus,
    });
  } catch (err) {
    console.error('ToggleMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

// ─── GET MENU STATS (Admin) ───────────────────────────────────────────────────

/**
 * GET /api/menu/stats
 * Requires: Admin Bearer token
 */
const getMenuStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT
        COUNT(*) as total_items,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_items,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_items,
        COUNT(DISTINCT category) as total_categories,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM menu_items
    `);

    const [byCategory] = await pool.execute(`
      SELECT category, COUNT(*) as count, AVG(price) as avg_price
      FROM menu_items
      GROUP BY category
      ORDER BY count DESC
    `);

    return res.json({
      success: true,
      data: {
        summary: stats[0],
        by_category: byCategory,
      },
    });
  } catch (err) {
    console.error('GetMenuStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu stats' });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  getMenuByCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemStatus,
  getMenuStats,
};
