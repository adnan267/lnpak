const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const rateLimit = require('../utils/rateLimit');
const { INQUIRY_TYPES } = require('../utils/enums');
const { isEmail, readEnum, textOrNull } = require('../utils/validate');

const router = express.Router();

// A person sending the same form again and again is almost always a script.
const submitLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many messages sent. Please try again in a few minutes.',
});

// POST /api/inquiries  (public — contact form, Free Consultation popup and Research & Support form;
// attaches user_id if logged in)
//   body: { full_name, email, phone?, message?, service_id?, inquiry_type?: 'general' | 'consultation' | 'research', country_interest? }
router.post('/', submitLimit, async (req, res) => {
  const body = req.body || {};
  const inquiry_type = readEnum(body.inquiry_type, INQUIRY_TYPES, 'general');
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = textOrNull(body.message, 5000);
  const phone = textOrNull(body.phone, 30);
  const country_interest = textOrNull(body.country_interest, 100);

  const errors = [];
  if (!full_name) errors.push('Full name is required.');
  else if (full_name.length > 100) errors.push('Full name is too long.');
  if (!isEmail(email)) errors.push('A valid email is required.');
  // A free-consultation request can be just name + contact details; every other form needs a message.
  if (!message && inquiry_type !== 'consultation') errors.push('Please write a short message.');
  if (typeof body.phone === 'string' && body.phone.trim().length > 30) errors.push('Phone number is too long.');

  let service_id = null;
  if (body.service_id !== undefined && body.service_id !== null && String(body.service_id).trim() !== '') {
    service_id = Number(body.service_id);
    if (!Number.isInteger(service_id) || service_id < 1) errors.push('Invalid program.');
  }

  if (errors.length) return res.status(400).json({ errors });

  try {
    await pool.query(
      `INSERT INTO inquiries (user_id, service_id, full_name, email, phone, message, inquiry_type, country_interest)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user?.id || null, service_id, full_name, email, phone, message, inquiry_type, country_interest]
    );
    res.status(201).json({ message: 'Thanks! Your message has been received. Our team will contact you soon.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not submit your inquiry.' });
  }
});

// GET /api/inquiries/mine  (logged-in user's own inquiry history)
router.get('/mine', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Please log in.' });
  try {
    const [rows] = await pool.query(
      `SELECT i.*, s.title AS service_title
       FROM inquiries i
       LEFT JOIN services s ON s.id = i.service_id
       WHERE i.user_id = ?
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json({ inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load your inquiries.' });
  }
});

// GET /api/inquiries  (admin — list all, optional ?status= and ?type= filters)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = [];
    const params = [];
    if (['new', 'contacted', 'closed'].includes(status)) {
      where.push('i.status = ?');
      params.push(status);
    }
    if (INQUIRY_TYPES.includes(type)) {
      where.push('i.inquiry_type = ?');
      params.push(type);
    }

    const [rows] = await pool.query(
      `SELECT i.*, s.title AS service_title
       FROM inquiries i
       LEFT JOIN services s ON s.id = i.service_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY i.created_at DESC`,
      params
    );
    res.json({ inquiries: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load inquiries.' });
  }
});

// PATCH /api/inquiries/:id  (admin — update status)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['new', 'contacted', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }
  try {
    await pool.query('UPDATE inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Inquiry status updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update inquiry.' });
  }
});

module.exports = router;
