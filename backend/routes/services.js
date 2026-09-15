const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const slugify = require('../utils/slugify');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// GET /api/services  (public — active services only, unless ?all=1 and requester is admin)
router.get('/', async (req, res) => {
  const showAll = req.query.all === '1' && req.user?.role === 'admin';
  const sql = showAll
    ? 'SELECT * FROM services ORDER BY created_at DESC'
    : 'SELECT * FROM services WHERE is_active = 1 ORDER BY created_at DESC';
  const [rows] = await pool.query(sql);
  res.json({ services: rows });
});

// GET /api/services/admin/:id  (admin — fetch by id, regardless of active status, for the edit form)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Service not found.' });
  res.json({ service: rows[0] });
});

// GET /api/services/:slug  (public)
router.get('/:slug', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM services WHERE slug = ? AND is_active = 1 LIMIT 1',
    [req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Service not found.' });
  res.json({ service: rows[0] });
});

// POST /api/services  (admin — create, optional image upload)
router.post('/', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { title, country, short_description, description } = req.body;
    const is_active = req.body.is_active === 'false' ? 0 : 1;

    if (!title || !title.trim()) {
      return res.status(400).json({ errors: ['Title is required.'] });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const [dupe] = await pool.query('SELECT id FROM services WHERE slug = ?', [slug]);
      if (!dupe.length) break;
      slug = `${baseSlug}-${++i}`;
    }

    const imagePath = req.file ? `uploads/services/${req.file.filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO services (title, slug, country, short_description, description, image, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title.trim(), slug, country || null, short_description || null, description || null, imagePath, is_active]
    );

    res.status(201).json({ message: 'Service created.', id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create service.' });
  }
});

// PUT /api/services/:id  (admin — update, optional new image)
router.put('/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existingRows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ message: 'Service not found.' });

    const { title, country, short_description, description } = req.body;
    const is_active = req.body.is_active === 'false' ? 0 : 1;

    if (!title || !title.trim()) {
      return res.status(400).json({ errors: ['Title is required.'] });
    }

    let slug = existing.slug;
    if (title.trim().toLowerCase() !== existing.title.toLowerCase()) {
      const baseSlug = slugify(title);
      slug = baseSlug;
      let i = 1;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const [dupe] = await pool.query('SELECT id FROM services WHERE slug = ? AND id != ?', [slug, id]);
        if (!dupe.length) break;
        slug = `${baseSlug}-${++i}`;
      }
    }

    let imagePath = existing.image;
    if (req.file) {
      // remove old image file if present
      if (existing.image) {
        const oldPath = path.join(__dirname, '..', existing.image);
        fs.unlink(oldPath, () => {});
      }
      imagePath = `uploads/services/${req.file.filename}`;
    }

    await pool.query(
      'UPDATE services SET title=?, slug=?, country=?, short_description=?, description=?, image=?, is_active=? WHERE id=?',
      [title.trim(), slug, country || null, short_description || null, description || null, imagePath, is_active, id]
    );

    res.json({ message: 'Service updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update service.' });
  }
});

// DELETE /api/services/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT image FROM services WHERE id = ?', [id]);
    if (rows[0]?.image) {
      const filePath = path.join(__dirname, '..', rows[0].image);
      fs.unlink(filePath, () => {});
    }
    await pool.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Service deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete service.' });
  }
});

module.exports = router;
