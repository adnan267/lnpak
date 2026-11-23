const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const slugify = require('../utils/slugify');
const { cleanTranslations, withTranslations } = require('../utils/translations');
const { normaliseCurrency, parseMoney } = require('../utils/currencies');
const { TRANSPORT_TYPES } = require('../utils/enums');
const { textOrNull, readSet, uniqueSlug } = require('../utils/validate');

const router = express.Router();
const imageUpload = upload.createUpload('tours', 'tour');

const TRANSLATABLE_FIELDS = ['title', 'destination', 'short_description', 'description', 'price_note'];
const MAX_HOTELS = 30;

const COLUMNS = [
  'title', 'destination', 'country', 'duration_days', 'price', 'price_currency', 'price_note',
  'short_description', 'description', 'transport', 'translations', 'is_active',
];

/**
 * People per room is either one number ("2") or a range ("1-3"). Both are stored as min/max,
 * with min = max for a single value. Accepts { people_min, people_max } where max may be empty.
 */
function readPeoplePerRoom(hotel, label) {
  const min = Number(hotel.people_min);
  const maxGiven = hotel.people_max !== undefined && hotel.people_max !== null && String(hotel.people_max).trim() !== '';
  const max = maxGiven ? Number(hotel.people_max) : min;

  if (!Number.isInteger(min) || min < 1 || min > 20) return { error: `${label}: people per room must be a whole number from 1 to 20.` };
  if (!Number.isInteger(max) || max < 1 || max > 20) return { error: `${label}: the highest people-per-room value must be a whole number from 1 to 20.` };
  if (max < min) return { error: `${label}: the highest people-per-room value cannot be lower than the lowest.` };
  return { min, max };
}

/** Hotels are optional: an empty / missing list is fine. */
function readHotels(raw) {
  let list = raw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { return { errors: ['Hotel list could not be read.'] }; }
  }
  if (list === undefined || list === null || list === '') list = [];
  if (!Array.isArray(list)) return { errors: ['Hotel list could not be read.'] };
  if (list.length > MAX_HOTELS) return { errors: [`A package can have at most ${MAX_HOTELS} hotels.`] };

  const errors = [];
  const hotels = [];
  list.forEach((h, i) => {
    const label = `Hotel ${i + 1}`;
    const name = typeof h?.name === 'string' ? h.name.trim() : '';
    if (!name) { errors.push(`${label}: hotel name is required (or remove the row).`); return; }

    const people = readPeoplePerRoom(h, label);
    if (people.error) { errors.push(people.error); return; }

    let stars = null;
    if (h.stars !== undefined && h.stars !== null && String(h.stars).trim() !== '') {
      stars = Number(h.stars);
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) { errors.push(`${label}: stars must be from 1 to 5.`); return; }
    }

    hotels.push({
      name: name.slice(0, 200),
      city: textOrNull(h.city, 100),
      stars,
      people_per_room_min: people.min,
      people_per_room_max: people.max,
      notes: textOrNull(h.notes, 255),
    });
  });
  return errors.length ? { errors } : { hotels };
}

function readPackageBody(body) {
  const errors = [];
  const title = (body.title || '').trim();
  if (!title) errors.push('Title is required.');

  const price = parseMoney(body.price);
  if (price === undefined) errors.push('Price must be a valid positive number.');

  let duration_days = null;
  if (body.duration_days !== undefined && String(body.duration_days).trim() !== '') {
    duration_days = Number(body.duration_days);
    if (!Number.isInteger(duration_days) || duration_days < 1 || duration_days > 365) {
      errors.push('Duration must be a whole number of days from 1 to 365.');
    }
  }

  // Transportation: one or more of plane / train / car / bus / boat (may be empty).
  const transport = readSet(body.transport, TRANSPORT_TYPES);

  const hotelResult = readHotels(body.hotels);
  if (hotelResult.errors) errors.push(...hotelResult.errors);

  if (errors.length) return { errors };
  return {
    hotels: hotelResult.hotels,
    values: {
      title,
      destination: textOrNull(body.destination, 150),
      country: textOrNull(body.country, 100),
      duration_days,
      price,
      price_currency: normaliseCurrency(body.price_currency),
      price_note: textOrNull(body.price_note, 255),
      short_description: textOrNull(body.short_description, 255),
      description: textOrNull(body.description, 20000),
      transport: transport.join(','),
      translations: cleanTranslations(body.translations, TRANSLATABLE_FIELDS),
      is_active: body.is_active === 'false' ? 0 : 1,
    },
  };
}

async function attachHotels(packages) {
  if (!packages.length) return packages;
  const [hotels] = await pool.query(
    'SELECT * FROM tour_package_hotels WHERE package_id IN (?) ORDER BY sort_order ASC, id ASC',
    [packages.map((p) => p.id)]
  );
  return packages.map((p) => ({ ...withTranslations(p), hotels: hotels.filter((h) => h.package_id === p.id) }));
}

async function saveHotels(conn, packageId, hotels) {
  await conn.query('DELETE FROM tour_package_hotels WHERE package_id = ?', [packageId]);
  for (let i = 0; i < hotels.length; i += 1) {
    const h = hotels[i];
    await conn.query(
      `INSERT INTO tour_package_hotels
         (package_id, name, city, stars, people_per_room_min, people_per_room_max, notes, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [packageId, h.name, h.city, h.stars, h.people_per_room_min, h.people_per_room_max, h.notes, i]
    );
  }
}

// GET /api/tour-packages  (public; admin: ?all=1 includes hidden ones)   optional ?transport=plane,bus  ?q=
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === '1' && req.user?.role === 'admin';
    const where = [];
    const params = [];
    if (!showAll) where.push('is_active = 1');

    const transports = readSet(req.query.transport, TRANSPORT_TYPES);
    if (transports.length) {
      where.push(`(${transports.map(() => 'FIND_IN_SET(?, transport)').join(' OR ')})`);
      params.push(...transports);
    }
    if (req.query.q) {
      where.push('(title LIKE ? OR destination LIKE ? OR country LIKE ?)');
      const like = `%${String(req.query.q).trim()}%`;
      params.push(like, like, like);
    }

    const [rows] = await pool.query(
      `SELECT * FROM tour_packages ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC`,
      params
    );
    res.json({ packages: await attachHotels(rows) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load tour packages.' });
  }
});

// GET /api/tour-packages/admin/:id  (admin)
router.get('/admin/:id', requireAdmin, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tour_packages WHERE id = ?', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Tour package not found.' });
  const [pkg] = await attachHotels(rows);
  res.json({ package: pkg });
});

// GET /api/tour-packages/:slug  (public)
router.get('/:slug', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM tour_packages WHERE slug = ? AND is_active = 1 LIMIT 1', [req.params.slug]);
  if (!rows[0]) return res.status(404).json({ message: 'Tour package not found.' });
  const [pkg] = await attachHotels(rows);
  res.json({ package: pkg });
});

// POST /api/tour-packages  (admin)   multipart: fields + `hotels` (JSON list) + optional `image`
router.post('/', requireAdmin, imageUpload.single('image'), async (req, res) => {
  let conn;
  try {
    const { errors, values, hotels } = readPackageBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    const slug = await uniqueSlug(pool, 'tour_packages', slugify(values.title));
    const imagePath = req.file ? `uploads/tours/${req.file.filename}` : null;

    conn = await pool.getConnection();
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO tour_packages (slug, image, ${COLUMNS.join(', ')}) VALUES (?, ?, ${COLUMNS.map(() => '?').join(', ')})`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c])]
    );
    await saveHotels(conn, result.insertId, hotels);
    await conn.commit();

    res.status(201).json({ message: 'Tour package created.', id: result.insertId, slug });
  } catch (err) {
    if (conn) await conn.rollback();
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error(err);
    res.status(500).json({ message: 'Could not create tour package.' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/tour-packages/:id  (admin) — the submitted hotel list replaces the old one (an empty list removes all hotels)
router.put('/:id', requireAdmin, imageUpload.single('image'), async (req, res) => {
  let conn;
  try {
    const id = Number(req.params.id);
    const [existingRows] = await pool.query('SELECT * FROM tour_packages WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Tour package not found.' });
    }

    const { errors, values, hotels } = readPackageBody(req.body);
    if (errors) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ errors });
    }

    let slug = existing.slug;
    if (values.title.toLowerCase() !== existing.title.toLowerCase()) {
      slug = await uniqueSlug(pool, 'tour_packages', slugify(values.title), id);
    }
    const imagePath = req.file ? `uploads/tours/${req.file.filename}` : existing.image;

    conn = await pool.getConnection();
    await conn.beginTransaction();
    await conn.query(
      `UPDATE tour_packages SET slug = ?, image = ?, ${COLUMNS.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [slug, imagePath, ...COLUMNS.map((c) => values[c]), id]
    );
    await saveHotels(conn, id, hotels);
    await conn.commit();

    if (req.file && existing.image) fs.unlink(path.join(__dirname, '..', existing.image), () => {});
    res.json({ message: 'Tour package updated.' });
  } catch (err) {
    if (conn) await conn.rollback();
    if (req.file) fs.unlink(req.file.path, () => {});
    console.error(err);
    res.status(500).json({ message: 'Could not update tour package.' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/tour-packages/:id  (admin) — hotels are removed with it (ON DELETE CASCADE)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT image FROM tour_packages WHERE id = ?', [id]);
    if (rows[0]?.image) fs.unlink(path.join(__dirname, '..', rows[0].image), () => {});
    await pool.query('DELETE FROM tour_packages WHERE id = ?', [id]);
    res.json({ message: 'Tour package deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not delete tour package.' });
  }
});

module.exports = router;
