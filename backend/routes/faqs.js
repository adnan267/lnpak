const express = require('express');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const slugify = require('../utils/slugify');
const { cleanTranslations, withTranslations } = require('../utils/translations');
const { FAQ_PAGES } = require('../utils/enums');
const { readSet, uniqueSlug } = require('../utils/validate');

const router = express.Router();

function readSortOrder(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 100000 ? n : 0;
}

// ---------- Categories ----------

// GET /api/faqs/categories  (public)
router.get('/categories', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM faq_categories ORDER BY sort_order ASC, name ASC');
  res.json({ categories: rows.map(withTranslations) });
});

function readCategoryBody(body) {
  const name = (body.name || '').trim();
  if (!name) return { errors: ['Category name is required.'] };
  return {
    values: {
      name: name.slice(0, 150),
      sort_order: readSortOrder(body.sort_order),
      translations: cleanTranslations(body.translations, ['name']),
    },
  };
}

// POST /api/faqs/categories  (admin)
router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { errors, values } = readCategoryBody(req.body);
    if (errors) return res.status(400).json({ errors });
    const slug = await uniqueSlug(pool, 'faq_categories', slugify(values.name));
    const [result] = await pool.query(
      'INSERT INTO faq_categories (name, slug, sort_order, translations) VALUES (?, ?, ?, ?)',
      [values.name, slug, values.sort_order, values.translations]
    );
    res.status(201).json({ message: 'Category created.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create category.' });
  }
});

// PUT /api/faqs/categories/:id  (admin)
router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await pool.query('SELECT id FROM faq_categories WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Category not found.' });
    const { errors, values } = readCategoryBody(req.body);
    if (errors) return res.status(400).json({ errors });
    await pool.query('UPDATE faq_categories SET name = ?, sort_order = ?, translations = ? WHERE id = ?', [
      values.name, values.sort_order, values.translations, id,
    ]);
    res.json({ message: 'Category updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not update category.' });
  }
});

// DELETE /api/faqs/categories/:id  (admin) — its questions are kept and become "uncategorised"
router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM faq_categories WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete category.' });
  }
});

// ---------- Questions ----------

async function loadFaqs({ page, includeHidden }) {
  const where = [];
  const params = [];
  if (!includeHidden) where.push('f.is_active = 1');
  if (page) {
    where.push('EXISTS (SELECT 1 FROM faq_pages fp WHERE fp.faq_id = f.id AND fp.page_key = ?)');
    params.push(page);
  }

  const [rows] = await pool.query(
    `SELECT f.*, c.name AS category_name, c.translations AS category_translations, c.sort_order AS category_order
     FROM faqs f
     LEFT JOIN faq_categories c ON c.id = f.category_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY (c.id IS NULL), c.sort_order ASC, c.name ASC, f.sort_order ASC, f.id ASC`,
    params
  );
  if (!rows.length) return [];

  const [pageRows] = await pool.query('SELECT faq_id, page_key FROM faq_pages WHERE faq_id IN (?)', [rows.map((r) => r.id)]);
  return rows.map((row) => ({
    ...withTranslations(row),
    category_translations: withTranslations({ translations: row.category_translations }).translations,
    pages: pageRows.filter((p) => p.faq_id === row.id).map((p) => p.page_key),
  }));
}

// GET /api/faqs  (public)  ?page=home|about|services|education-scholarships|tour-packages|research-support|contact
//   Without ?page it returns every visible question. Admin: ?all=1 also returns hidden questions.
router.get('/', async (req, res) => {
  try {
    const page = FAQ_PAGES.includes(req.query.page) ? req.query.page : null;
    const includeHidden = req.query.all === '1' && req.user?.role === 'admin';
    res.json({ faqs: await loadFaqs({ page, includeHidden }), pages: FAQ_PAGES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load FAQs.' });
  }
});

async function readFaqBody(body) {
  const errors = [];
  const question = (body.question || '').trim();
  const answer = (body.answer || '').trim();
  if (!question) errors.push('Question is required.');
  if (!answer) errors.push('Answer is required.');

  let category_id = null;
  if (body.category_id !== undefined && body.category_id !== null && String(body.category_id).trim() !== '') {
    category_id = Number(body.category_id);
    const [found] = Number.isInteger(category_id)
      ? await pool.query('SELECT id FROM faq_categories WHERE id = ?', [category_id])
      : [[]];
    if (!found.length) errors.push('Choose a valid category or leave it empty.');
  }

  const pages = readSet(body.pages, FAQ_PAGES);

  if (errors.length) return { errors };
  return {
    values: {
      question: question.slice(0, 500),
      answer: answer.replace(/\r\n?/g, '\n').slice(0, 10000),
      category_id,
      sort_order: readSortOrder(body.sort_order),
      is_active: body.is_active === false || body.is_active === 'false' ? 0 : 1,
      translations: cleanTranslations(body.translations, ['question', 'answer']),
    },
    pages,
  };
}

async function savePages(conn, faqId, pages) {
  await conn.query('DELETE FROM faq_pages WHERE faq_id = ?', [faqId]);
  for (const key of pages) {
    await conn.query('INSERT INTO faq_pages (faq_id, page_key) VALUES (?, ?)', [faqId, key]);
  }
}

// POST /api/faqs  (admin)   body: { question, answer, category_id, pages: ['home', ...], sort_order, is_active, translations }
router.post('/', requireAdmin, async (req, res) => {
  let conn;
  try {
    const { errors, values, pages } = await readFaqBody(req.body);
    if (errors) return res.status(400).json({ errors });

    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO faqs (category_id, question, answer, sort_order, is_active, translations) VALUES (?, ?, ?, ?, ?, ?)`,
      [values.category_id, values.question, values.answer, values.sort_order, values.is_active, values.translations]
    );
    await savePages(conn, result.insertId, pages);
    await conn.commit();
    res.status(201).json({ message: 'Question created.', id: result.insertId });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not create question.' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/faqs/:id  (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    const [existing] = await pool.query('SELECT id FROM faqs WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ message: 'Question not found.' });

    const { errors, values, pages } = await readFaqBody(req.body);
    if (errors) return res.status(400).json({ errors });

    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query(
      `UPDATE faqs SET category_id = ?, question = ?, answer = ?, sort_order = ?, is_active = ?, translations = ? WHERE id = ?`,
      [values.category_id, values.question, values.answer, values.sort_order, values.is_active, values.translations, id]
    );
    await savePages(conn, id, pages);
    await conn.commit();
    res.json({ message: 'Question updated.' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Could not update question.' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/faqs/:id  (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM faqs WHERE id = ?', [Number(req.params.id)]);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete question.' });
  }
});

module.exports = router;
