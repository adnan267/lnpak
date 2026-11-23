const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const rateLimit = require('../utils/rateLimit');
const { isEmail, textOrNull } = require('../utils/validate');

const router = express.Router();

// 20 sign-ups per 10 minutes per address is plenty for people and stops scripts flooding the list.
const subscribeLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many sign-up attempts. Please try again in a few minutes.',
});

// POST /api/newsletter/subscribe  (public)   body: { email, name? }
router.post('/subscribe', subscribeLimit, async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!isEmail(email)) return res.status(400).json({ errors: ['A valid email is required.'] });
  const name = textOrNull(req.body.name, 100);

  try {
    // Signing up again after unsubscribing simply re-activates the address.
    await pool.query(
      `INSERT INTO newsletter_subscribers (email, name, source)
       VALUES (?, ?, 'website')
       ON DUPLICATE KEY UPDATE
         status = 'subscribed',
         unsubscribed_at = NULL,
         name = COALESCE(VALUES(name), name)`,
      [email, name]
    );
    // Same answer whether or not the address was already on the list.
    res.status(201).json({ message: 'Thank you for subscribing!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not subscribe right now. Please try again.' });
  }
});

// GET /api/newsletter  (admin)   ?q=  ?status=subscribed|unsubscribed
router.get('/', requireAdmin, async (req, res) => {
  try {
    const where = [];
    const params = [];
    if (['subscribed', 'unsubscribed'].includes(req.query.status)) {
      where.push('status = ?');
      params.push(req.query.status);
    }
    if (req.query.q) {
      where.push('(email LIKE ? OR name LIKE ?)');
      const like = `%${String(req.query.q).trim()}%`;
      params.push(like, like);
    }
    const [rows] = await pool.query(
      `SELECT * FROM newsletter_subscribers ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 5000`,
      params
    );
    const [[counts]] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(status = 'subscribed') AS subscribed FROM newsletter_subscribers`
    );
    res.json({
      subscribers: rows,
      total: Number(counts.total) || 0,
      subscribed: Number(counts.subscribed) || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load subscribers.' });
  }
});

/** Spreadsheet programs run text starting with = + - @ as a formula; a leading quote keeps it plain text. */
function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

// GET /api/newsletter/export  (admin) — CSV of the subscribers that are currently subscribed (or all with ?status=all)
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const onlyActive = req.query.status !== 'all';
    const [rows] = await pool.query(
      `SELECT email, name, status, source, created_at FROM newsletter_subscribers
       ${onlyActive ? "WHERE status = 'subscribed'" : ''} ORDER BY created_at DESC`
    );
    const lines = [['Email', 'Name', 'Status', 'Source', 'Subscribed on'].map(csvCell).join(',')];
    for (const r of rows) {
      lines.push([r.email, r.name, r.status, r.source, new Date(r.created_at).toISOString().slice(0, 10)].map(csvCell).join(','));
    }
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="newsletter-subscribers.csv"',
    });
    // The BOM makes Excel read Russian / Chinese names correctly.
    res.send(`﻿${lines.join('\r\n')}\r\n`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not export subscribers.' });
  }
});

// PATCH /api/newsletter/:id  (admin)   body: { status: 'subscribed' | 'unsubscribed' }
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['subscribed', 'unsubscribed'].includes(status)) return res.status(400).json({ message: 'Invalid status.' });
  try {
    const [result] = await pool.query(
      `UPDATE newsletter_subscribers
       SET status = ?, unsubscribed_at = ${status === 'unsubscribed' ? 'NOW()' : 'NULL'}
       WHERE id = ?`,
      [status, Number(req.params.id)]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Subscriber not found.' });
    res.json({ message: 'Subscriber updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update subscriber.' });
  }
});

// DELETE /api/newsletter/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM newsletter_subscribers WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Subscriber deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete subscriber.' });
  }
});

module.exports = router;
