// Currencies the site can show prices in. To add one: add its ISO code to CURRENCIES, a symbol to
// SYMBOLS and a fallback rate to FALLBACK_RATES (the frontend reads the list from GET /api/currency).
const CURRENCIES = ['USD', 'EUR', 'CNY', 'PKR', 'INR', 'RUB', 'TRY', 'GBP'];

const SYMBOLS = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  PKR: '₨',
  INR: '₹',
  RUB: '₽',
  TRY: '₺',
  GBP: '£',
};

// How a price is written: symbol only ($1,200), text only (USD 1,200) or both ($1,200 USD).
const FORMATS = ['symbol', 'text', 'both'];

// Approximate fallback rates (units of currency per 1 USD), only used when the live
// exchange-rate service cannot be reached AND no earlier live rates are cached.
const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.88,
  CNY: 7.2,
  PKR: 280,
  INR: 84,
  RUB: 92,
  TRY: 34,
  GBP: 0.76,
};

function isSupportedCurrency(code) {
  return CURRENCIES.includes(String(code || '').toUpperCase());
}

/** Normalises user input to a supported ISO code, defaulting to USD. */
function normaliseCurrency(code) {
  const upper = String(code || '').toUpperCase();
  return CURRENCIES.includes(upper) ? upper : 'USD';
}

/** Parses an optional money field from a form: '' / undefined -> null, invalid -> undefined. */
function parseMoney(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 9999999999) return undefined;
  return Math.round(n * 100) / 100;
}

module.exports = { CURRENCIES, SYMBOLS, FORMATS, FALLBACK_RATES, isSupportedCurrency, normaliseCurrency, parseMoney };
