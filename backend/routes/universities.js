const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const slugify = require('../utils/slugify');
const { cleanTranslations, withTranslations } = require('../utils/translations');
const { readFee } = require('../utils/fees');
const { SCHOLARSHIP_TYPES, FUNDING_SOURCES, TEACHING_LANGUAGES } = require('../utils/enums');
const { textOrNull, readSet, readEnum, readUrl, uniqueSlug, listParam } = require('../utils/validate');

const router = express.Router();
const logoUpload = upload.createUpload('universities', 'uni');

const TRANSLATABLE_FIELDS = ['name', 'city', 'description', 'fee_text', 'intake'];

/** Validates + normalises the body of a create/update request. Returns { errors } or { values }. */
function readUniversityBody(body) {
  const errors = [];
  const name = (body.name || '').trim();
  const country = (body.country || '').trim();
  if (!name) errors.push('University name is required.');
  if (!country) errors.push('Country is required.');

  const fee = readFee(body);
  if (fee.errors) errors.push(...fee.errors);

  let ranking = null;
  if (body.ranking !== undefined && String(body.ranking).trim() !== '') {
    ranking = Number(body.ranking);
    if (!Number.isInteger(ranking) || ranking < 1 || ranking > 100000) {
      errors.push('Ranking must be a whole number of 1 or more.');
    }
  }

  const url = readUrl(body.website);
  if (url.error) errors.push(url.error);

  // Scholarship option: a type and a funding source (both 'none' when the university has none).
  let scholarship_type = readEnum(body.scholarship_type, SCHOLARSHIP_TYPES, 'none');
  let scholarship_source = readEnum(body.scholarship_source, FUNDING_SOURCES, 'none');
  if (scholarship_type === 'none') scholarship_source = 'none';
  else if (scholarship_source === 'none') errors.push('Choose the scholarship funding source (government or institution).');

  const languages = readSet(body.languages, TEACHING_LANGUAGES);
  if (!languages.length) errors.push('Choose at least one teaching language.');

  if (errors.length) return { errors };

  return {
    values: {
      name,
      country,
      city: textOrNull(body.city, 100),
      description: textOrNull(body.description, 20000),
      ...fee.values,
      ranking,
      website: url.value,
      intake: textOrNull(body.intake, 100),
      scholarship_type,
      scholarship_source,
      languages: languages.join(','),
      is_active: body.is_active === 'false' ? 0 : 1,
      translations: cleanTranslations(body.translations, TRANSLATABLE_FIELDS),
    },
  };
}

const COLUMNS = [
  'name', 'country', 'city', 'description', 'fee_mode', 'tuition_fee', 'tuition_fee_max', 'fee_currency', 'fee_text',
  'ranking', 'website', 'intake', 'scholarship_type', 'scholarship_source', 'languages', 'translations', 'is_active',
];

// GET /api/universities  (public)
//   ?q=  ?country=A,B  ?city=  ?languages=en,ru  ?scholarship=full|partial|institutional|any  ?funding=government|institution
//   ?sort=name|fee_asc|fee_desc|ranking      (admin: ?all=1 includes hidden ones)
//   Leaving country / languages out (or empty) means "all".
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === '1' && req.user?.role === 'admin';
    const where = [];
    const params = [];

    if (!showAll) where.push('is_active = 1');

    const countries = listParam(req.query.country);
    if (countries.length) {
      where.push('country IN (?)');
      params.push(countries);
    }
    if (req.query.city) {
      where.push('city = ?');
      params.push(String(req.query.city));
    }
    if (req.query.q) {
      where.push('(name LIKE ? OR city LIKE ? OR country LIKE ?)');
      const like = `%${String(req.query.q).trim()}%`;
      params.push(like, like, like);
    }

    const languages = readSet(listParam(req.query.languages), TEACHING_LANGUAGES);
    if (languages.length) {
      where.push(`(${languages.map(() => 'FIND_IN_SET(?, languages)').join(' OR ')})`);
      params.push(...languages);
    }

    if (req.query.scholarship === 'any') {
      where.push("scholarship_type <> 'none'");
    } else if (SCHOLARSHIP_TYPES.includes(req.query.scholarship)) {
      where.push('scholarship_type = ?');
      params.push(req.query.scholarship);
    }
    if (FUNDING_SOURCES.includes(req.query.funding)) {
      where.push('scholarship_source = ?');
      params.push(req.query.funding);
    }

    // Fee sorting compares raw numbers, so it is only a rough order when universities use
    // different currencies; the page re-sorts by converted value.
    const orderBy = {
      fee_asc: 'tuition_fee IS NULL, tuition_fee ASC, name ASC',
      fee_desc: 'tuition_fee IS NULL, tuition_fee DESC, name ASC',
      ranking: 'ranking IS NULL, ranking ASC, name ASC',
    }[req.query.sort] || 'name ASC';

    const [rows] = await pool.query(
      `SELECT * FROM universities ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}`,
      params
    );

    // Filter dropdown values come from all visible universities, not just the current result.
    const visible = showAll ? '' : 'WHERE is_active = 1';
    const [countryRows] = await pool.query(`SELECT DISTINCT country FROM universities ${visible} ORDER BY country`);

    res.json({
      universities: rows.map(withTranslations),
      countries: countryRows.map((r) => r.country),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load universities.' });
  }
});

// GET /api/universities/admin/:id  (admin — for the edit form, even if hidden)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM universities WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'University not found.' });
  res.json({ university: withTranslations(rows[0]) });
});

// GET /api/universities/:slug  (public)
router.get('/:slug', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM universities WHERE slug = ? AND is_active = 1 LIMIT 1',
    [req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ message: 'University not found.' });
  res.json({ university: withTranslations(rows[0]) });
});

// POST /api/universities  (admin)
router.post('/', requireAdmin, logoUpload.single('image'), async (req, res) => {
  try {
    const { errors, values } = readUniversityBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    const slug = await uniqueSlug(pool, 'universities', slugify(values.name));
    const imagePath = req.file ? `uploads/universities/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO universities (slug, image, ${COLUMNS.join(', ')}) VALUES (?, ?, ${COLUMNS.map(() => '?').join(', ')})`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c])]
    );

    res.status(201).json({ message: 'University created.', id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create university.' });
  }
});

// PUT /api/universities/:id  (admin)
router.put('/:id', requireAdmin, logoUpload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existingRows] = await pool.query('SELECT * FROM universities WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'University not found.' });
    }

    const { errors, values } = readUniversityBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    let slug = existing.slug;
    if (values.name.toLowerCase() !== existing.name.toLowerCase()) {
      slug = await uniqueSlug(pool, 'universities', slugify(values.name), id);
    }

    let imagePath = existing.image;
    if (req.file) {
      if (existing.image) fs.unlink(path.join(__dirname, '..', existing.image), () => {});
      imagePath = `uploads/universities/${req.file.filename}`;
    }

    await pool.query(
      `UPDATE universities SET slug = ?, image = ?, ${COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c]), id]
    );

    res.json({ message: 'University updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update university.' });
  }
});

// DELETE /api/universities/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT image FROM universities WHERE id = ?', [id]);
    if (rows[0]?.image) fs.unlink(path.join(__dirname, '..', rows[0].image), () => {});
    await pool.query('DELETE FROM universities WHERE id = ?', [id]);
    res.json({ message: 'University deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete university.' });
  }
});

module.exports = router;
