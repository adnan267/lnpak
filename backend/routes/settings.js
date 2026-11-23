const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const { CURRENCIES, SYMBOLS, FORMATS } = require('../utils/currencies');
const { getCurrencySettings, saveCurrencySettings } = require('../utils/settings');

const router = express.Router();

// GET /api/settings  (admin)
router.get('/', requireAdmin, async (req, res) => {
  res.json({ currency: await getCurrencySettings(), currencies: CURRENCIES, symbols: SYMBOLS, formats: FORMATS });
});

// PUT /api/settings  (admin)  body: { enabled: ['USD', ...], default: 'USD', format: 'symbol' | 'text' | 'both' }
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { errors, settings } = await saveCurrencySettings(req.body || {});
    if (errors) return res.status(400).json({ errors });
    res.json({ message: 'Settings saved.', currency: settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not save settings.' });
  }
});

module.exports = router;
