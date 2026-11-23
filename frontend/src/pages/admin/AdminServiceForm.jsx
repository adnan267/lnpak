import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import TranslationFields from '../../components/admin/TranslationFields';
import { ALL_CURRENCIES } from '../../context/CurrencyContext';
import { serviceImageUrl } from '../../utils/imageUrl';

const emptyForm = {
  title: '',
  country: '',
  short_description: '',
  description: '',
  service_fee: '',
  fee_currency: 'USD',
  is_active: true,
};

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Title' },
  { name: 'short_description', label: 'Short Description' },
  { name: 'description', label: 'Full Description', textarea: true },
];

export default function AdminServiceForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [translations, setTranslations] = useState({});
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/services/admin/${id}`).then(({ data }) => {
        const s = data.service;
        setForm({
          title: s.title,
          country: s.country || '',
          short_description: s.short_description || '',
          description: s.description || '',
          service_fee: s.service_fee === null || s.service_fee === undefined ? '' : String(Number(s.service_fee)),
          fee_currency: s.fee_currency || 'USD',
          is_active: Boolean(s.is_active),
        });
        setTranslations(s.translations || {});
        setExistingImage(s.image);
      });
    }
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('country', form.country);
    fd.append('short_description', form.short_description);
    fd.append('description', form.description);
    fd.append('service_fee', form.service_fee);
    fd.append('fee_currency', form.fee_currency);
    fd.append('translations', JSON.stringify(translations));
    fd.append('is_active', form.is_active ? 'true' : 'false');
    if (imageFile) fd.append('image', imageFile);

    try {
      if (isEdit) {
        await api.put(`/services/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/services', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/admin/services');
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="fw-bold mb-4">{isEdit ? 'Edit Service' : 'Add Service'}</h1>

      {errors.length > 0 && (
        <div className="alert alert-danger">
          <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: 700 }}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Country</label>
          <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Short Description (shown on cards)</label>
          <input type="text" name="short_description" maxLength={255} className="form-control" value={form.short_description} onChange={handleChange} />
        </div>
        <div className="mb-3">
          <label className="form-label">Full Description</label>
          <textarea name="description" rows={6} className="form-control" value={form.description} onChange={handleChange}></textarea>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-7">
            <label className="form-label">Service fee (optional)</label>
            <input
              type="number"
              name="service_fee"
              min="0"
              step="0.01"
              className="form-control"
              placeholder="Leave empty to hide the fee"
              value={form.service_fee}
              onChange={handleChange}
            />
          </div>
          <div className="col-sm-5">
            <label className="form-label">Fee currency</label>
            <select name="fee_currency" className="form-select" value={form.fee_currency} onChange={handleChange}>
              {ALL_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </div>
          <div className="col-12 form-text mt-0">
            Visitors see this converted into the currency they pick on the site.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Image</label>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setImageFile(e.target.files[0])} />
          {existingImage && !imageFile && (
            <img src={serviceImageUrl({ image: existingImage })} className="mt-2 rounded" style={{ height: 90 }} alt="Current" />
          )}
        </div>

        <TranslationFields value={translations} onChange={setTranslations} fields={TRANSLATION_FIELDS} />

        <div className="form-check mb-3">
          <input type="checkbox" name="is_active" id="is_active" className="form-check-input" checked={form.is_active} onChange={handleChange} />
          <label htmlFor="is_active" className="form-check-label">Visible on the site</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Service'}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/services')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
