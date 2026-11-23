const express = require('express');
const { CURRENCIES, SYMBOLS, FALLBACK_RATES } = require('../utils/currencies');
const { getCurrencySettings } = require('../utils/settings');

const router = express.Router();

const CACHE_MS = 6 * 60 * 60 * 1000; // refresh live rates at most every 6 hours
const RATES_URL = process.env.EXCHANGE_RATES_URL || 'https://open.er-api.com/v6/latest/USD';

let cache = null; // { rates, updatedAt, source }

async function fetchLiveRates() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(RATES_URL, { signal: controller.signal });
    if (!response.ok) throw new Error(`Rates service responded ${response.status}`);
    const data = await response.json();
    if (!data || !data.rates) throw new Error('Unexpected rates response');

    const rates = {};
    for (const code of CURRENCIES) {
      const value = Number(data.rates[code]);
      if (!Number.isFinite(value) || value <= 0) throw new Error(`Missing rate for ${code}`);
      rates[code] = value;
    }
    rates.USD = 1;
    return { rates, updatedAt: new Date().toISOString(), source: 'live' };
  } finally {
    clearTimeout(timer);
  }
}

async function getRates() {
  const fresh = cache && Date.now() - new Date(cache.updatedAt).getTime() < CACHE_MS;
  if (fresh) return cache;

  try {
    cache = await fetchLiveRates();
  } catch (err) {
    console.error('Exchange rate refresh failed:', err.message);
    // Keep serving older live rates if we have them, otherwise the static fallback.
    if (!cache) {
      cache = { rates: { ...FALLBACK_RATES }, updatedAt: new Date().toISOString(), source: 'fallback' };
      // Retry the live service again soon instead of waiting the full cache window.
      setTimeout(() => { if (cache && cache.source === 'fallback') cache = null; }, 5 * 60 * 1000).unref();
    }
  }
  return cache;
}

// GET /api/currency
//   -> { base, currencies (all supported), enabled (shown to visitors), default, format, symbols, rates, updatedAt, source }
router.get('/', async (req, res) => {
  const [{ rates, updatedAt, source }, settings] = await Promise.all([getRates(), getCurrencySettings()]);
  res.json({
    base: 'USD',
    currencies: CURRENCIES,
    enabled: settings.enabled,
    default: settings.default,
    format: settings.format,
    symbols: SYMBOLS,
    rates,
    updatedAt,
    source,
  });
});

module.exports = router;
