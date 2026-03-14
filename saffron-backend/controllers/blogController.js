const { pool } = require('../config/db');

// ─── HELPER ───────────────────────────────────────────────────────────────────

const slugify = (text) =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + '-' + Date.now();

// ─── GET ALL PUBLISHED POSTS (Public) ────────────────────────────────────────

/**
 * GET /api/blog
 * Query: { category?, page?, limit? }
 */
const getAllPosts = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.image, bp.category,
             bp.status, bp.published_at, bp.created_at,
             u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published'
    `;
    const params = [];

    if (category) { query += ' AND bp.category = ?'; params.push(category); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY bp.published_at DESC LIMIT ? OFFSET ?';
    query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [rows] = await pool.query(query, params);
    const [countRows] = await pool.execute(
      "SELECT COUNT(*) as total FROM blog_posts WHERE status = 'published'"
    );

    return res.json({
      success: true,
      data: rows,
      total: countRows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('GetAllPosts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
  }
};

// ─── GET ALL POSTS FOR ADMIN ──────────────────────────────────────────────────

/**
 * GET /api/blog/admin/all
 * Requires: Admin Bearer token
 */
const getAdminAllPosts = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      ORDER BY bp.created_at DESC
    `);
    return res.json({ success: true, data: rows, total: rows.length });
  } catch (err) {
    console.error('GetAdminAllPosts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
  }
};

// ─── GET SINGLE POST BY SLUG (Public) ────────────────────────────────────────

/**
 * GET /api/blog/:slug
 */
const getPostBySlug = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT bp.*, u.name as author_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = ? AND bp.status = 'published'
    `, [req.params.slug]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('GetPostBySlug error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
};

// ─── CREATE POST (Admin) ──────────────────────────────────────────────────────

/**
 * POST /api/blog
 * Body: { title, content, excerpt?, image?, category?, status? }
 * Requires: Admin Bearer token
 */
const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const slug = slugify(title);
    const postStatus = status === 'published' ? 'published' : 'draft';
    const published_at = postStatus === 'published' ? new Date() : null;

    const [result] = await pool.execute(
      `INSERT INTO blog_posts
         (title, slug, content, excerpt, image, category, author_id, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), slug, content, excerpt || null, image || null, category || null, req.user.id, postStatus, published_at]
    );

    return res.status(201).json({
      success: true,
      message: `Post ${postStatus === 'published' ? 'published' : 'saved as draft'}`,
      id: result.insertId,
      slug,
    });
  } catch (err) {
    console.error('CreatePost error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// ─── UPDATE POST (Admin) ──────────────────────────────────────────────────────

/**
 * PUT /api/blog/:id
 * Body: { title?, content?, excerpt?, image?, category?, status? }
 * Requires: Admin Bearer token
 */
const updatePost = async (req, res) => {
  try {
    const { title, content, excerpt, image, category, status } = req.body;

    const [existing] = await pool.execute('SELECT * FROM blog_posts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const current = existing[0];
    const newStatus = status || current.status;
    // Set published_at only when transitioning to published for the first time
    const published_at =
      newStatus === 'published' && current.status !== 'published'
        ? new Date()
        : current.published_at;

    await pool.execute(
      `UPDATE blog_posts
       SET title = ?, content = ?, excerpt = ?, image = ?, category = ?,
           status = ?, published_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        title || current.title,
        content || current.content,
        excerpt !== undefined ? excerpt : current.excerpt,
        image !== undefined ? image : current.image,
        category !== undefined ? category : current.category,
        newStatus,
        published_at,
        req.params.id,
      ]
    );

    return res.json({ success: true, message: 'Post updated successfully' });
  } catch (err) {
    console.error('UpdatePost error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update post' });
  }
};

// ─── DELETE POST (Admin) ──────────────────────────────────────────────────────

/**
 * DELETE /api/blog/:id
 * Requires: Admin Bearer token
 */
const deletePost = async (req, res) => {
  try {
    const [existing] = await pool.execute('SELECT id FROM blog_posts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    await pool.execute('DELETE FROM blog_posts WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('DeletePost error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete post' });
  }
};

module.exports = { getAllPosts, getAdminAllPosts, getPostBySlug, createPost, updatePost, deletePost };