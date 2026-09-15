const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

// POST /api/inquiries  (public contact form — attaches user_id if logged in)
router.post('/', async (req, res) => {
  const { full_name, email, phone, message, service_id } = req.body;
  const errors = [];

  if (!full_name || !full_name.trim()) errors.push('Full name is required.');
  if (!isEmail(email || '')) errors.push('A valid email is required.');
  if (!message || !message.trim()) errors.push('Please write a short message.');

  if (errors.length) return res.status(400).json({ errors });

  try {
    await pool.query(
      'INSERT INTO inquiries (user_id, service_id, full_name, email, phone, message) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user?.id || null, service_id || null, full_name.trim(), email.trim(), phone || null, message.trim()]
    );
    res.status(201).json({ message: "Thanks! Your message has been received. Our team will contact you soon." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not submit your inquiry.' });
  }
});

// GET /api/inquiries/mine  (logged-in user's own inquiry history)
router.get('/mine', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Please log in.' });
  const [rows] = await pool.query(
    `SELECT i.*, s.title AS service_title
     FROM inquiries i
     LEFT JOIN services s ON s.id = i.service_id
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC`,
    [req.user.id]
  );
  res.json({ inquiries: rows });
});

// GET /api/inquiries  (admin — list all, optional ?status= filter)
router.get('/', requireAdmin, async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT i.*, s.title AS service_title
    FROM inquiries i
    LEFT JOIN services s ON s.id = i.service_id
  `;
  const params = [];
  if (['new', 'contacted', 'closed'].includes(status)) {
    sql += ' WHERE i.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY i.created_at DESC';

  const [rows] = await pool.query(sql, params);
  res.json({ inquiries: rows });
});

// PATCH /api/inquiries/:id  (admin — update status)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  await pool.query('UPDATE inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Inquiry status updated.' });
});

module.exports = router;
