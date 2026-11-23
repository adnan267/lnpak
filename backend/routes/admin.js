const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  const [[{ totalServices }]] = await pool.query('SELECT COUNT(*) AS totalServices FROM services');
  const [[{ totalUniversities }]] = await pool.query('SELECT COUNT(*) AS totalUniversities FROM universities');
  const [[{ totalScholarships }]] = await pool.query('SELECT COUNT(*) AS totalScholarships FROM scholarships');
  const [[{ totalTourPackages }]] = await pool.query('SELECT COUNT(*) AS totalTourPackages FROM tour_packages');
  const [[{ totalSubscribers }]] = await pool.query("SELECT COUNT(*) AS totalSubscribers FROM newsletter_subscribers WHERE status = 'subscribed'");
  const [[{ totalInquiries }]] = await pool.query('SELECT COUNT(*) AS totalInquiries FROM inquiries');
  const [[{ newInquiries }]] = await pool.query("SELECT COUNT(*) AS newInquiries FROM inquiries WHERE status = 'new'");
  const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'");
  const [recentInquiries] = await pool.query(`
    SELECT i.*, s.title AS service_title
    FROM inquiries i
    LEFT JOIN services s ON s.id = i.service_id
    ORDER BY i.created_at DESC
    LIMIT 5
  `);

  res.json({
    totalServices,
    totalUniversities,
    totalScholarships,
    totalTourPackages,
    totalSubscribers,
    totalInquiries,
    newInquiries,
    totalUsers,
    recentInquiries,
  });
});

module.exports = router;
