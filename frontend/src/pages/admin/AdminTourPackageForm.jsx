import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import CheckboxGroup, { ErrorList } from '../../components/admin/CheckboxGroup';
import TranslationFields from '../../components/admin/TranslationFields';
import { ADMIN_LABELS, TRANSPORT_TYPES } from '../../constants';
import { ALL_CURRENCIES } from '../../context/CurrencyContext';
import { tourImageUrl } from '../../utils/imageUrl';

const emptyForm = {
  title: '', destination: '', country: '', duration_days: '', price: '', price_currency: 'USD', price_note: '',
  short_description: '', description: '', is_active: true,
};
const emptyHotel = () => ({ key: Math.random().toString(36).slice(2), name: '', city: '', stars: '', mode: 'single', people_min: '2', people_max: '', notes: '' });

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Title' },
  { name: 'destination', label: 'Destination' },
  { name: 'short_description', label: 'Short description' },
  { name: 'description', label: 'Description', textarea: true },
  { name: 'price_note', label: 'Price note' },
];

export default function AdminTourPackageForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [transport, setTransport] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [translations, setTranslations] = useState({});
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/tour-packages/admin/${id}`).then(({ data }) => {
      const p = data.package;
      setForm({
        title: p.title, destination: p.destination || '', country: p.country || '',
        duration_days: p.duration_days ? String(p.duration_days) : '',
        price: p.price === null || p.price === undefined ? '' : String(Number(p.price)),
        price_currency: p.price_currency || 'USD', price_note: p.price_note || '',
        short_description: p.short_description || '', description: p.description || '', is_active: Boolean(p.is_active),
      });
      setTransport((p.transport || '').split(',').filter(Boolean));
      setHotels(p.hotels.map((h) => ({
        key: String(h.id), name: h.name, city: h.city || '', stars: h.stars ? String(h.stars) : '',
        mode: h.people_per_room_min === h.people_per_room_max ? 'single' : 'range',
        people_min: String(h.people_per_room_min),
        people_max: h.people_per_room_min === h.people_per_room_max ? '' : String(h.people_per_room_max),
        notes: h.notes || '',
      })));
      setTranslations(p.translations || {});
      setExistingImage(p.image);
    });
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }
  function setHotel(key, patch) {
    setHotels((list) => list.map((h) => (h.key === key ? { ...h, ...patch } : h)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, key === 'is_active' ? (value ? 'true' : 'false') : value));
    fd.append('transport', transport.join(','));
    fd.append('hotels', JSON.stringify(hotels.map((h) => ({
      name: h.name, city: h.city, stars: h.stars, notes: h.notes,
      people_min: h.people_min, people_max: h.mode === 'range' ? h.people_max : '',
    }))));
    fd.append('translations', JSON.stringify(translations));
    if (imageFile) fd.append('image', imageFile);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEdit) await api.put(`/tour-packages/${id}`, fd, config);
      else await api.post('/tour-packages', fd, config);
      navigate('/admin/tour-packages');
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="fw-bold mb-4">{isEdit ? 'Edit Tour Package' : 'Add Tour Package'}</h1>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: 800 }}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input type="text" name="title" maxLength={200} className="form-control" value={form.title} onChange={handleChange} required />
        </div>
        <div className="row g-3 mb-3">
          <div className="col-sm-4"><label className="form-label">Destination</label><input type="text" name="destination" className="form-control" value={form.destination} onChange={handleChange} /></div>
          <div className="col-sm-4"><label className="form-label">Country</label><input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} /></div>
          <div className="col-sm-4"><label className="form-label">Duration (days)</label><input type="number" min="1" name="duration_days" className="form-control" value={form.duration_days} onChange={handleChange} /></div>
          <div className="col-sm-4"><label className="form-label">Price</label><input type="number" min="0" step="0.01" name="price" className="form-control" value={form.price} onChange={handleChange} /></div>
          <div className="col-sm-3">
            <label className="form-label">Currency</label>
            <select name="price_currency" className="form-select" value={form.price_currency} onChange={handleChange}>
              {ALL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-sm-5"><label className="form-label">Price note</label><input type="text" name="price_note" placeholder="e.g. per person" className="form-control" value={form.price_note} onChange={handleChange} /></div>
        </div>

        <div className="mb-3">
          <label className="form-label d-block">Transportation</label>
          <CheckboxGroup idPrefix="tour-tr" options={TRANSPORT_TYPES.map((k) => ({ key: k, label: ADMIN_LABELS.transport[k] }))} value={transport} onChange={setTransport} />
          <div className="form-text">Choose one or more.</div>
        </div>

        <fieldset className="border rounded p-3 mb-3">
          <legend className="float-none w-auto px-2 fs-6 fw-semibold">Hotels</legend>
          {hotels.length === 0 && <p className="text-muted small">No hotels: the package is shown without a hotel section.</p>}
          {hotels.map((h, i) => (
            <div className="border rounded p-3 mb-3 bg-light" key={h.key}>
              <div className="d-flex justify-content-between mb-2">
                <strong>Hotel {i + 1}</strong>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setHotels(hotels.filter((x) => x.key !== h.key))}><i className="bi bi-trash"></i> Remove</button>
              </div>
              <div className="row g-2">
                <div className="col-md-6"><input type="text" className="form-control" placeholder="Hotel name" value={h.name} onChange={(e) => setHotel(h.key, { name: e.target.value })} required /></div>
                <div className="col-md-4"><input type="text" className="form-control" placeholder="City" value={h.city} onChange={(e) => setHotel(h.key, { city: e.target.value })} /></div>
                <div className="col-md-2">
                  <select className="form-select" value={h.stars} onChange={(e) => setHotel(h.key, { stars: e.target.value })} aria-label="Stars">
                    <option value="">Stars</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}★</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={h.mode} onChange={(e) => setHotel(h.key, { mode: e.target.value })} aria-label="People per room type">
                    <option value="single">People per room: single value</option>
                    <option value="range">People per room: range</option>
                  </select>
                </div>
                <div className="col-md-2"><input type="number" min="1" max="20" className="form-control" placeholder={h.mode === 'range' ? 'From' : 'People'} value={h.people_min} onChange={(e) => setHotel(h.key, { people_min: e.target.value })} required /></div>
                {h.mode === 'range' && (
                  <div className="col-md-2"><input type="number" min="1" max="20" className="form-control" placeholder="To" value={h.people_max} onChange={(e) => setHotel(h.key, { people_max: e.target.value })} required /></div>
                )}
                <div className="col-12"><input type="text" className="form-control" placeholder="Notes (optional)" value={h.notes} onChange={(e) => setHotel(h.key, { notes: e.target.value })} /></div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setHotels([...hotels, emptyHotel()])}><i className="bi bi-plus-lg"></i> Add hotel</button>
        </fieldset>

        <div className="mb-3"><label className="form-label">Short description</label><input type="text" name="short_description" maxLength={255} className="form-control" value={form.short_description} onChange={handleChange} /></div>
        <div className="mb-3"><label className="form-label">Description</label><textarea name="description" rows={6} className="form-control" value={form.description} onChange={handleChange}></textarea></div>
        <div className="mb-3">
          <label className="form-label">Image</label>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setImageFile(e.target.files[0])} />
          {existingImage && !imageFile && <img src={tourImageUrl({ image: existingImage })} className="mt-2 rounded" style={{ height: 90 }} alt="Current" />}
        </div>

        <TranslationFields value={translations} onChange={setTranslations} fields={TRANSLATION_FIELDS} />

        <div className="form-check mb-3">
          <input type="checkbox" name="is_active" id="tour_active" className="form-check-input" checked={form.is_active} onChange={handleChange} />
          <label htmlFor="tour_active" className="form-check-label">Visible on the site</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Package'}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/tour-packages')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
