const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const slugify = require('../utils/slugify');
const { cleanTranslations, withTranslations } = require('../utils/translations');
const { SCHOLARSHIP_TYPES, FUNDING_SOURCES, TEACHING_LANGUAGES, STUDY_LEVELS } = require('../utils/enums');
const { textOrNull, listParam, readSet, readEnum, readDate, readUrl, uniqueSlug } = require('../utils/validate');

const router = express.Router();
const imageUpload = upload.createUpload('scholarships', 'sch');

const TRANSLATABLE_FIELDS = ['title', 'summary', 'funding_details'];

const COLUMNS = [
  'title', 'country', 'university_id', 'scholarship_type', 'funding_source', 'level', 'languages',
  'summary', 'funding_details', 'deadline', 'website', 'translations', 'is_active',
];

const SELECT = `
  SELECT s.*, u.name AS university_name, u.slug AS university_slug
  FROM scholarships s
  LEFT JOIN universities u ON u.id = s.university_id
`;

async function readScholarshipBody(body) {
  const errors = [];

  const title = (body.title || '').trim();
  if (!title) errors.push('Title is required.');

  const scholarship_type = readEnum(body.scholarship_type, SCHOLARSHIP_TYPES, null);
  if (!scholarship_type) errors.push('Choose the scholarship type (fully funded, partially funded or institutional).');

  const funding_source = readEnum(body.funding_source, FUNDING_SOURCES, null);
  if (!funding_source) errors.push('Choose the funding source (government-based or institution-based).');

  const languages = readSet(body.languages, TEACHING_LANGUAGES);
  if (!languages.length) errors.push('Choose at least one language.');

  const deadline = readDate(body.deadline);
  if (deadline === undefined) errors.push('Deadline must be a valid date.');

  const url = readUrl(body.website);
  if (url.error) errors.push(url.error);

  let university_id = null;
  if (body.university_id !== undefined && String(body.university_id).trim() !== '') {
    university_id = Number(body.university_id);
    if (!Number.isInteger(university_id) || university_id < 1) {
      errors.push('Choose a valid university or leave it empty.');
    } else {
      const [found] = await pool.query('SELECT id FROM universities WHERE id = ?', [university_id]);
      if (!found.length) errors.push('The chosen university does not exist.');
    }
  }

  if (errors.length) return { errors };

  return {
    values: {
      title,
      country: textOrNull(body.country, 100),
      university_id,
      scholarship_type,
      funding_source,
      level: readEnum(body.level, STUDY_LEVELS, 'any'),
      languages: languages.join(','),
      summary: textOrNull(body.summary, 500),
      // Stored exactly as typed (line breaks and "- " bullets included); the website formats it when displaying.
      funding_details: typeof body.funding_details === 'string' && body.funding_details.trim()
        ? body.funding_details.replace(/\r\n?/g, '\n').trim().slice(0, 20000)
        : null,
      deadline,
      website: url.value,
      translations: cleanTranslations(body.translations, TRANSLATABLE_FIELDS),
      is_active: body.is_active === 'false' ? 0 : 1,
    },
  };
}

// GET /api/scholarships  (public)
//   ?q=  ?country=A,B  ?languages=en,ru  ?type=full|partial|institutional  ?funding=government|institution
//   ?level=bachelor|master|phd  ?sort=deadline|title      (admin: ?all=1 includes hidden ones)
//   Leaving country / languages out (or empty) means "all".
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === '1' && req.user?.role === 'admin';
    const where = [];
    const params = [];

    if (!showAll) where.push('s.is_active = 1');

    const countries = listParam(req.query.country);
    if (countries.length) {
      where.push('s.country IN (?)');
      params.push(countries);
    }
    if (req.query.q) {
      where.push('(s.title LIKE ? OR s.summary LIKE ? OR s.country LIKE ? OR u.name LIKE ?)');
      const like = `%${String(req.query.q).trim()}%`;
      params.push(like, like, like, like);
    }
    const languages = readSet(listParam(req.query.languages), TEACHING_LANGUAGES);
    if (languages.length) {
      where.push(`(${languages.map(() => 'FIND_IN_SET(?, s.languages)').join(' OR ')})`);
      params.push(...languages);
    }
    if (SCHOLARSHIP_TYPES.includes(req.query.type)) {
      where.push('s.scholarship_type = ?');
      params.push(req.query.type);
    }
    if (FUNDING_SOURCES.includes(req.query.funding)) {
      where.push('s.funding_source = ?');
      params.push(req.query.funding);
    }
    if (['bachelor', 'master', 'phd'].includes(req.query.level)) {
      // A scholarship open to "any" level fits every level filter.
      where.push("s.level IN (?, 'any')");
      params.push(req.query.level);
    }

    const orderBy = req.query.sort === 'title'
      ? 's.title ASC'
      : 's.deadline IS NULL, s.deadline ASC, s.title ASC';

    const [rows] = await pool.query(
      `${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${orderBy}`,
      params
    );
    const [countryRows] = await pool.query(
      `SELECT DISTINCT country FROM scholarships WHERE country IS NOT NULL ${showAll ? '' : 'AND is_active = 1'} ORDER BY country`
    );

    res.json({ scholarships: rows.map(withTranslations), countries: countryRows.map((r) => r.country) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load scholarships.' });
  }
});

// GET /api/scholarships/admin/:id  (admin — for the edit form, even if hidden)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE s.id = ?`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Scholarship not found.' });
  res.json({ scholarship: withTranslations(rows[0]) });
});

// GET /api/scholarships/:slug  (public)
router.get('/:slug', async (req, res) => {
  const [rows] = await pool.query(`${SELECT} WHERE s.slug = ? AND s.is_active = 1 LIMIT 1`, [req.params.slug]);
  if (!rows[0]) return res.status(404).json({ message: 'Scholarship not found.' });
  res.json({ scholarship: withTranslations(rows[0]) });
});

// POST /api/scholarships  (admin)
router.post('/', requireAdmin, imageUpload.single('image'), async (req, res) => {
  try {
    const { errors, values } = await readScholarshipBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    const slug = await uniqueSlug(pool, 'scholarships', slugify(values.title));
    const imagePath = req.file ? `uploads/scholarships/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO scholarships (slug, image, ${COLUMNS.join(', ')}) VALUES (?, ?, ${COLUMNS.map(() => '?').join(', ')})`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c])]
    );
    res.status(201).json({ message: 'Scholarship created.', id: result.insertId, slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create scholarship.' });
  }
});

// PUT /api/scholarships/:id  (admin)
router.put('/:id', requireAdmin, imageUpload.single('image'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existingRows] = await pool.query('SELECT * FROM scholarships WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Scholarship not found.' });
    }

    const { errors, values } = await readScholarshipBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    let slug = existing.slug;
    if (values.title.toLowerCase() !== existing.title.toLowerCase()) {
      slug = await uniqueSlug(pool, 'scholarships', slugify(values.title), id);
    }

    let imagePath = existing.image;
    if (req.file) {
      if (existing.image) fs.unlink(path.join(__dirname, '..', existing.image), () => {});
      imagePath = `uploads/scholarships/${req.file.filename}`;
    }

    await pool.query(
      `UPDATE scholarships SET slug = ?, image = ?, ${COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c]), id]
    );
    res.json({ message: 'Scholarship updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update scholarship.' });
  }
});

// DELETE /api/scholarships/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT image FROM scholarships WHERE id = ?', [id]);
    if (rows[0]?.image) fs.unlink(path.join(__dirname, '..', rows[0].image), () => {});
    await pool.query('DELETE FROM scholarships WHERE id = ?', [id]);
    res.json({ message: 'Scholarship deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete scholarship.' });
  }
});

module.exports = router;
