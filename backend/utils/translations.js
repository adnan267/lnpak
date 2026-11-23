// Helpers for the optional per-language text stored in a `translations` TEXT column.
// Shape: { "ru": { "title": "...", "description": "..." }, "zh": { ... } }
// English always lives in the normal columns; translations are optional overrides.

const LANGS = ['ru', 'zh'];

function parseTranslations(raw) {
  if (!raw) return {};
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

/** Keep only known languages + allowed fields, trim, and return a JSON string (or null if empty). */
function cleanTranslations(raw, fields) {
  const input = parseTranslations(raw);
  const out = {};
  for (const lang of LANGS) {
    const src = input[lang];
    if (!src || typeof src !== 'object') continue;
    const entry = {};
    for (const field of fields) {
      const value = typeof src[field] === 'string' ? src[field].trim() : '';
      if (value) entry[field] = value.slice(0, 10000);
    }
    if (Object.keys(entry).length) out[lang] = entry;
  }
  return Object.keys(out).length ? JSON.stringify(out) : null;
}

/** Return a row with `translations` parsed into an object (never a string). */
function withTranslations(row) {
  return { ...row, translations: parseTranslations(row.translations) };
}

module.exports = { LANGS, parseTranslations, cleanTranslations, withTranslations };
