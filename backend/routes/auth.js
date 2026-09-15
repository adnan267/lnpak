const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function signAndSetCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, fullName: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, confirm_password } = req.body;
    const errors = [];

    if (!full_name || !full_name.trim()) errors.push('Full name is required.');
    if (!isEmail(email || '')) errors.push('A valid email is required.');
    if (!password || password.length < 6) errors.push('Password must be at least 6 characters.');
    if (password !== confirm_password) errors.push('Passwords do not match.');

    if (errors.length) return res.status(400).json({ errors });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ errors: ['An account with this email already exists.'] });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
      [full_name.trim(), email.trim(), phone || null, hash]
    );

    res.status(201).json({ message: 'Account created successfully.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while creating your account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email || '']);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ errors: ['Invalid email or password.'] });
    }

    signAndSetCookie(res, user);
    res.json({
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, full_name, email, phone, role FROM users WHERE id = ?', [req.user.id]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rows[0] });
});

module.exports = router;
