const { pool } = require('../config/db');
const { deleteImage: deleteCloudinaryImage } = require('../config/cloudinary');

// ─── GET ALL ──────────────────────────────────────────────────────────────────
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
    return res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
  }
};

// ─── UPLOAD (Cloudinary via multer OR URL) ────────────────────────────────────
const uploadImage = async (req, res) => {
  try {
    const { title, category, url } = req.body;
    // req.file.path = Cloudinary URL when using multer-storage-cloudinary
    const imageUrl = req.file?.path || url;

    if (!imageUrl)
      return res.status(400).json({ success: false, message: 'Image file or URL required' });

    const [result] = await pool.execute(
      'INSERT INTO gallery (title, filename, category) VALUES (?, ?, ?)',
      [title || null, imageUrl, category || 'General']
    );
    const [newImage] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Image added', data: newImage[0] });
  } catch (err) {
    console.error('UploadImage error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
};

// ─── UPDATE METADATA ──────────────────────────────────────────────────────────
const updateImage = async (req, res) => {
  try {
    const { title, category } = req.body;
    const [existing] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Not found' });
    await pool.execute('UPDATE gallery SET title=?, category=? WHERE id=?',
      [title||existing[0].title, category||existing[0].category, req.params.id]);
    return res.json({ success: true, message: 'Image updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update image' });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteImage = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    await deleteCloudinaryImage(rows[0].filename);
    await pool.execute('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
};

module.exports = { getAllImages, uploadImage, updateImage, deleteImage };