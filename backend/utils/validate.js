const slugify = require('./slugify');

/** Trimmed string, or null when empty. */
function textOrNull(value, max = 5000) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s ? s.slice(0, max) : null;
}

/**
 * Accepts 'en,ru', ['en','ru'] or a JSON array string and returns the allowed values as a
 * de-duplicated list in the order of `allowed`.
 */
function readSet(value, allowed) {
  let list = value;
  if (typeof list === 'string') {
    const trimmed = list.trim();
    if (trimmed.startsWith('[')) {
      try { list = JSON.parse(trimmed); } catch { list = []; }
    } else {
      list = trimmed ? trimmed.split(',') : [];
    }
  }
  if (!Array.isArray(list)) list = [];
  const wanted = new Set(list.map((v) => String(v).trim().toLowerCase()));
  return allowed.filter((v) => wanted.has(v));
}

/** Turns "United Kingdom,Canada" (or a repeated query parameter) into a clean list. */
function listParam(value) {
  const raw = Array.isArray(value) ? value.join(',') : String(value || '');
  return raw.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
}

/** Allowed values only; anything else becomes `fallback`. */
function readEnum(value, allowed, fallback) {
  const v = String(value || '').trim().toLowerCase();
  return allowed.includes(v) ? v : fallback;
}

/** 'YYYY-MM-DD' -> same string, '' -> null, anything else -> undefined (invalid). */
function readDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) return undefined;
  return s;
}

/** Only plain http(s) links are accepted, because the site renders them as clickable links. */
function readUrl(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return { value: null };
  try {
    const url = new URL(s);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('bad protocol');
    return { value: url.toString() };
  } catch {
    return { error: 'Website must be a full link starting with http:// or https://.' };
  }
}

/** Next free slug in `table` (table names here are always hard-coded by the callers). */
async function uniqueSlug(pool, table, base, excludeId = null) {
  let slug = base || slugify('item');
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [dupe] = excludeId
      ? await pool.query(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`, [slug, excludeId])
      : await pool.query(`SELECT id FROM ${table} WHERE slug = ?`, [slug]);
    if (!dupe.length) return slug;
    slug = `${base}-${++i}`;
  }
}

function isEmail(str) {
  return typeof str === 'string' && str.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

module.exports = { textOrNull, listParam, readSet, readEnum, readDate, readUrl, uniqueSlug, isEmail };
