import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import TranslationFields from '../../components/admin/TranslationFields';
import CheckboxGroup, { ErrorList } from '../../components/admin/CheckboxGroup';
import { ALL_CURRENCIES } from '../../context/CurrencyContext';
import { ADMIN_LABELS, FUNDING_SOURCES, SCHOLARSHIP_TYPES, TEACHING_LANGUAGES } from '../../constants';
import { universityImageUrl } from '../../utils/imageUrl';

const emptyForm = {
  name: '',
  country: '',
  city: '',
  fee_mode: 'single',
  tuition_fee: '',
  tuition_fee_max: '',
  fee_text: '',
  scholarship_type: 'none',
  scholarship_source: 'none',
  fee_currency: 'USD',
  ranking: '',
  website: '',
  intake: '',
  description: '',
  is_active: true,
};

const TRANSLATION_FIELDS = [
  { name: 'name', label: 'University name' },
  { name: 'city', label: 'City' },
  { name: 'fee_text', label: 'Tuition fee text' },
  { name: 'description', label: 'Description', textarea: true },
];

export default function AdminUniversityForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [languages, setLanguages] = useState(['en']);
  const [translations, setTranslations] = useState({});
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/universities/admin/${id}`).then(({ data }) => {
      const u = data.university;
      setForm({
        name: u.name,
        country: u.country || '',
        city: u.city || '',
        fee_mode: u.fee_mode || 'none',
        tuition_fee: u.tuition_fee === null || u.tuition_fee === undefined ? '' : String(Number(u.tuition_fee)),
        tuition_fee_max: u.tuition_fee_max === null || u.tuition_fee_max === undefined ? '' : String(Number(u.tuition_fee_max)),
        fee_text: u.fee_text || '',
        scholarship_type: u.scholarship_type || 'none',
        scholarship_source: u.scholarship_source || 'none',
        fee_currency: u.fee_currency || 'USD',
        ranking: u.ranking === null || u.ranking === undefined ? '' : String(u.ranking),
        website: u.website || '',
        intake: u.intake || '',
        description: u.description || '',
        is_active: Boolean(u.is_active),
      });
      setLanguages((u.languages || '').split(',').filter(Boolean));
      setTranslations(u.translations || {});
      setExistingImage(u.image);
    });
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
    Object.entries(form).forEach(([key, value]) => {
      fd.append(key, key === 'is_active' ? (value ? 'true' : 'false') : value);
    });
    fd.append('languages', languages.join(','));
    fd.append('translations', JSON.stringify(translations));
    if (imageFile) fd.append('image', imageFile);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEdit) await api.put(`/universities/${id}`, fd, config);
      else await api.post('/universities', fd, config);
      navigate('/admin/universities');
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="fw-bold mb-4">{isEdit ? 'Edit University' : 'Add University'}</h1>

      <ErrorList errors={errors} />

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: 700 }}>
        <div className="mb-3">
          <label className="form-label">University name</label>
          <input type="text" name="name" className="form-control" value={form.name} onChange={handleChange} required />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              list="country-suggestions"
              className="form-control"
              value={form.country}
              onChange={handleChange}
              required
            />
            <datalist id="country-suggestions">
              {['United Kingdom', 'Canada', 'Australia', 'United States', 'Germany', 'Ireland', 'New Zealand', 'Turkey', 'Malaysia', 'United Arab Emirates'].map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="form-text">Use the same spelling for every university in a country, so the filter groups them.</div>
          </div>
          <div className="col-sm-6">
            <label className="form-label">City</label>
            <input type="text" name="city" className="form-control" value={form.city} onChange={handleChange} />
          </div>
        </div>

        <fieldset className="border rounded p-3 mb-3">
          <legend className="float-none w-auto px-2 fs-6 fw-semibold">Tuition fee (per year)</legend>
          <div className="row g-3">
            <div className="col-sm-6">
              <label className="form-label">How to show the fee</label>
              <select name="fee_mode" className="form-select" value={form.fee_mode} onChange={handleChange}>
                <option value="single">Single amount</option>
                <option value="range">Range (from – to)</option>
                <option value="text">Text only (e.g. "Free for scholars")</option>
                <option value="none">Not set (fee on request)</option>
              </select>
            </div>
            {form.fee_mode !== 'text' && form.fee_mode !== 'none' && (
              <div className="col-sm-6">
                <label className="form-label">Currency</label>
                <select name="fee_currency" className="form-select" value={form.fee_currency} onChange={handleChange}>
                  {ALL_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
                </select>
              </div>
            )}
            {(form.fee_mode === 'single' || form.fee_mode === 'range') && (
              <div className="col-sm-6">
                <label className="form-label">{form.fee_mode === 'range' ? 'From' : 'Amount'}</label>
                <input type="number" name="tuition_fee" min="0" step="0.01" className="form-control" value={form.tuition_fee} onChange={handleChange} />
              </div>
            )}
            {form.fee_mode === 'range' && (
              <div className="col-sm-6">
                <label className="form-label">To</label>
                <input type="number" name="tuition_fee_max" min="0" step="0.01" className="form-control" value={form.tuition_fee_max} onChange={handleChange} />
              </div>
            )}
            <div className="col-12">
              <label className="form-label">Fee text {form.fee_mode === 'text' ? '' : '(optional, shown next to the amount)'}</label>
              <input type="text" name="fee_text" maxLength={255} className="form-control" value={form.fee_text} onChange={handleChange} />
            </div>
            <div className="col-12 form-text mt-1">Enter amounts in the currency the university lists. Visitors see them converted into the currency they choose.</div>
          </div>
        </fieldset>

        <fieldset className="border rounded p-3 mb-3">
          <legend className="float-none w-auto px-2 fs-6 fw-semibold">Scholarship</legend>
          <div className="row g-3">
            <div className="col-sm-6">
              <label className="form-label">Scholarship option</label>
              <select name="scholarship_type" className="form-select" value={form.scholarship_type} onChange={handleChange}>
                <option value="none">No scholarship</option>
                {SCHOLARSHIP_TYPES.map((k) => <option key={k} value={k}>{ADMIN_LABELS.scholarshipType[k]}</option>)}
              </select>
            </div>
            {form.scholarship_type !== 'none' && (
              <div className="col-sm-6">
                <label className="form-label">Funding source</label>
                <select name="scholarship_source" className="form-select" value={form.scholarship_source} onChange={handleChange} required>
                  <option value="none">Choose...</option>
                  {FUNDING_SOURCES.map((k) => <option key={k} value={k}>{ADMIN_LABELS.fundingSource[k]}</option>)}
                </select>
              </div>
            )}
          </div>
        </fieldset>

        <div className="mb-3">
          <label className="form-label d-block">Teaching languages</label>
          <CheckboxGroup
            idPrefix="uni-lang"
            options={TEACHING_LANGUAGES.map((k) => ({ key: k, label: ADMIN_LABELS.language[k] }))}
            value={languages}
            onChange={setLanguages}
          />
          <div className="form-text">Tick all three for "all languages".</div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-4">
            <label className="form-label">Ranking (optional)</label>
            <input type="number" name="ranking" min="1" step="1" className="form-control" value={form.ranking} onChange={handleChange} />
          </div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label className="form-label">Official website</label>
            <input type="url" name="website" placeholder="https://..." className="form-control" value={form.website} onChange={handleChange} />
          </div>
          <div className="col-sm-6">
            <label className="form-label">Intakes</label>
            <input type="text" name="intake" placeholder="e.g. September, January" className="form-control" value={form.intake} onChange={handleChange} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea name="description" rows={5} className="form-control" value={form.description} onChange={handleChange}></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Image / logo</label>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setImageFile(e.target.files[0])} />
          {existingImage && !imageFile && (
            <img src={universityImageUrl({ image: existingImage })} className="mt-2 rounded" style={{ height: 90 }} alt="Current" />
          )}
        </div>

        <TranslationFields value={translations} onChange={setTranslations} fields={TRANSLATION_FIELDS} />

        <div className="form-check mb-3">
          <input type="checkbox" name="is_active" id="is_active" className="form-check-input" checked={form.is_active} onChange={handleChange} />
          <label htmlFor="is_active" className="form-check-label">Visible on the site</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save University'}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/universities')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
