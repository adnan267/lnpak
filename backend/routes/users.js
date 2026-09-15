const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users  (admin only)
router.get('/', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users: rows });
});

// PATCH /api/users/:id/role  (admin only — toggle user/admin role)
router.patch('/:id/role', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(400).json({ message: "You can't change your own role." });
  }

  const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'User not found.' });

  const newRole = rows[0].role === 'admin' ? 'user' : 'admin';
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [newRole, id]);
  res.json({ message: 'User role updated.', role: newRole });
});

module.exports = router;
