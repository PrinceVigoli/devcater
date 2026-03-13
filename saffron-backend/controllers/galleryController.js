const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

// ─── GET ALL GALLERY IMAGES (Public) ─────────────────────────────────────────

/**
 * GET /api/gallery
 * Query: { category? }
 */
const getAllImages = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM gallery WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('GetAllImages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
  }
};

// ─── UPLOAD IMAGE (Admin) ─────────────────────────────────────────────────────

/**
 * POST /api/gallery
 * Body: { title?, category? } + image file (multipart)
 * Requires: Admin Bearer token
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const { title, category } = req.body;
    const filename = `/uploads/gallery/${req.file.filename}`;

    const [result] = await pool.execute(
      'INSERT INTO gallery (title, filename, category) VALUES (?, ?, ?)',
      [title || null, filename, category || 'General']
    );

    const [newImage] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: newImage[0],
    });
  } catch (err) {
    console.error('UploadImage error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
};

// ─── UPDATE IMAGE METADATA (Admin) ───────────────────────────────────────────

/**
 * PUT /api/gallery/:id
 * Body: { title?, category? }
 * Requires: Admin Bearer token
 */
const updateImage = async (req, res) => {
  try {
    const { title, category } = req.body;
    const [existing] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [req.params.id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await pool.execute(
      'UPDATE gallery SET title = ?, category = ? WHERE id = ?',
      [title || existing[0].title, category || existing[0].category, req.params.id]
    );

    return res.json({ success: true, message: 'Image updated successfully' });
  } catch (err) {
    console.error('UpdateImage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update image' });
  }
};

// ─── DELETE IMAGE (Admin) ─────────────────────────────────────────────────────

/**
 * DELETE /api/gallery/:id
 * Requires: Admin Bearer token
 */
const deleteImage = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    // Delete physical file from disk
    const filePath = path.join(__dirname, '..', rows[0].filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.execute('DELETE FROM gallery WHERE id = ?', [req.params.id]);

    return res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    console.error('DeleteImage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

module.exports = { getAllImages, uploadImage, updateImage, deleteImage };
