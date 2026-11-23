const pool = require('../config/db');
const { CURRENCIES, FORMATS } = require('./currencies');

const DEFAULTS = {
  currencies_enabled: CURRENCIES,
  currency_default: 'USD',
  currency_format: 'both',
};

let cache = null;

/** Currency display settings, edited by the admin on Admin > Settings. */
async function getCurrencySettings() {
  if (cache) return cache;

  let rows = [];
  try {
    [rows] = await pool.query('SELECT key_name, value FROM site_settings');
  } catch (err) {
    // The table is missing until the migration has been run; keep the site working with defaults.
    console.error('site_settings could not be read, using defaults:', err.message);
    return { enabled: DEFAULTS.currencies_enabled, default: DEFAULTS.currency_default, format: DEFAULTS.currency_format };
  }

  const map = Object.fromEntries(rows.map((r) => [r.key_name, r.value]));

  let enabled = DEFAULTS.currencies_enabled;
  try {
    const parsed = JSON.parse(map.currencies_enabled || 'null');
    if (Array.isArray(parsed)) {
      const valid = CURRENCIES.filter((c) => parsed.includes(c));
      if (valid.length) enabled = valid;
    }
  } catch { /* keep default */ }

  const format = FORMATS.includes(map.currency_format) ? map.currency_format : DEFAULTS.currency_format;
  const def = enabled.includes(map.currency_default) ? map.currency_default : enabled[0];

  cache = { enabled, default: def, format };
  return cache;
}

/** Validates and saves the settings. Returns { errors } or { settings }. */
async function saveCurrencySettings(input) {
  const errors = [];
  const wanted = Array.isArray(input.enabled) ? input.enabled : [];
  const enabled = CURRENCIES.filter((c) => wanted.includes(c));
  if (!enabled.length) errors.push('Choose at least one currency.');
  if (!FORMATS.includes(input.format)) errors.push('Choose how prices are written: symbol, text or both.');
  if (enabled.length && !enabled.includes(input.default)) errors.push('The default currency must be one of the selected currencies.');
  if (errors.length) return { errors };

  const entries = [
    ['currencies_enabled', JSON.stringify(enabled)],
    ['currency_default', input.default],
    ['currency_format', input.format],
  ];
  for (const [key, value] of entries) {
    await pool.query(
      'INSERT INTO site_settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [key, value]
    );
  }
  cache = null;
  return { settings: await getCurrencySettings() };
}

module.exports = { getCurrencySettings, saveCurrencySettings };
