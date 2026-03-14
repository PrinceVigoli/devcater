const { pool } = require('../config/db');
const { deleteImage } = require('../config/cloudinary');

// ─── GET ALL MENU ITEMS ───────────────────────────────────────────────────────
const getAllMenuItems = async (req, res) => {
  try {
    const { category, status = 'active', search, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM menu_items WHERE 1=1';
    const params = [];
    if (status)   { query += ' AND status = ?';  params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search)   { query += ' AND name LIKE ?';  params.push(`%${search}%`); }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY category ASC, name ASC';
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(query, params);
    const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM menu_items WHERE 1=1');
    return res.json({ success: true, data: rows, total: countRows[0].total });
  } catch (err) {
    console.error('GetAllMenuItems error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch menu items' });
  }
};

// ─── GET SINGLE ITEM ──────────────────────────────────────────────────────────
const getMenuItemById = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Menu item not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch menu item' });
  }
};

// ─── GET BY CATEGORY ──────────────────────────────────────────────────────────
const getMenuByCategory = async (req, res) => {
  try {
    const valid = ['Appetizers','Main Courses','Desserts','Beverages','Catering Packages'];
    if (!valid.includes(req.params.category))
      return res.status(400).json({ success: false, message: 'Invalid category' });
    const [rows] = await pool.execute(
      "SELECT * FROM menu_items WHERE category = ? AND status = 'active' ORDER BY name ASC",
      [req.params.category]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch category items' });
  }
};

// ─── CREATE MENU ITEM ─────────────────────────────────────────────────────────
const createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, status, image } = req.body;

    if (!name || !price || !category)
      return res.status(400).json({ success: false, message: 'Name, price, and category are required' });

    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0)
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });

    const valid = ['Appetizers','Main Courses','Desserts','Beverages','Catering Packages'];
    if (!valid.includes(category))
      return res.status(400).json({ success: false, message: 'Invalid category' });

    // Cloudinary URL comes from req.file.path, fallback to body image field (URL input)
    const imagePath = req.file?.path || image || null;

    const [result] = await pool.execute(
      'INSERT INTO menu_items (name, description, price, category, image, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description || null, parseFloat(price), category, imagePath, status || 'active']
    );

    const [newItem] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Menu item created', data: newItem[0] });
  } catch (err) {
    console.error('CreateMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create menu item' });
  }
};

// ─── UPDATE MENU ITEM ─────────────────────────────────────────────────────────
const updateMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, status, image } = req.body;
    const [existing] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Menu item not found' });

    const current = existing[0];

    // If new file uploaded to Cloudinary, delete old Cloudinary image
    let imagePath = current.image;
    if (req.file?.path) {
      await deleteImage(current.image);
      imagePath = req.file.path;
    } else if (image !== undefined) {
      imagePath = image;
    }

    await pool.execute(
      'UPDATE menu_items SET name=?, description=?, price=?, category=?, image=?, status=?, updated_at=NOW() WHERE id=?',
      [name||current.name, description!==undefined?description:current.description,
       price?parseFloat(price):current.price, category||current.category,
       imagePath, status||current.status, req.params.id]
    );

    const [updated] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Menu item updated', data: updated[0] });
  } catch (err) {
    console.error('UpdateMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update menu item' });
  }
};

// ─── DELETE MENU ITEM ─────────────────────────────────────────────────────────
const deleteMenuItem = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Menu item not found' });

    await deleteImage(existing[0].image);
    await pool.execute('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    console.error('DeleteMenuItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete menu item' });
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
const toggleMenuItemStatus = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT status FROM menu_items WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Item not found' });
    const newStatus = rows[0].status === 'active' ? 'inactive' : 'active';
    await pool.execute('UPDATE menu_items SET status=?, updated_at=NOW() WHERE id=?', [newStatus, req.params.id]);
    return res.json({ success: true, message: `Item ${newStatus}`, status: newStatus });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};

// ─── MENU STATS ───────────────────────────────────────────────────────────────
const getMenuStats = async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT COUNT(*) as total_items,
        COUNT(CASE WHEN status='active' THEN 1 END) as active_items,
        AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price
      FROM menu_items`);
    const [byCategory] = await pool.execute(
      'SELECT category, COUNT(*) as count FROM menu_items GROUP BY category ORDER BY count DESC'
    );
    return res.json({ success: true, data: { summary: stats[0], by_category: byCategory } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = {
  getAllMenuItems, getMenuItemById, getMenuByCategory,
  createMenuItem, updateMenuItem, deleteMenuItem,
  toggleMenuItemStatus, getMenuStats,
};