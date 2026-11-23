import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import CheckboxGroup, { ErrorList } from '../../components/admin/CheckboxGroup';
import TranslationFields from '../../components/admin/TranslationFields';
import FormattedText from '../../components/FormattedText';
import { ADMIN_LABELS, FUNDING_SOURCES, SCHOLARSHIP_TYPES, STUDY_LEVELS, TEACHING_LANGUAGES } from '../../constants';
import { scholarshipImageUrl } from '../../utils/imageUrl';

const emptyForm = {
  title: '', scholarship_type: '', funding_source: '', level: 'any', country: '', university_id: '',
  deadline: '', website: '', summary: '', funding_details: '', is_active: true,
};

const TRANSLATION_FIELDS = [
  { name: 'title', label: 'Title' },
  { name: 'summary', label: 'Short summary' },
  { name: 'funding_details', label: 'Funding details', textarea: true },
];

export default function AdminScholarshipForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [languages, setLanguages] = useState(['en']);
  const [translations, setTranslations] = useState({});
  const [universities, setUniversities] = useState([]);
  const [existingImage, setExistingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/universities?all=1').then(({ data }) => setUniversities(data.universities)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/scholarships/admin/${id}`).then(({ data }) => {
      const s = data.scholarship;
      setForm({
        title: s.title, scholarship_type: s.scholarship_type || '', funding_source: s.funding_source || '',
        level: s.level || 'any', country: s.country || '', university_id: s.university_id ? String(s.university_id) : '',
        deadline: s.deadline ? String(s.deadline).slice(0, 10) : '', website: s.website || '',
        summary: s.summary || '', funding_details: s.funding_details || '', is_active: Boolean(s.is_active),
      });
      setLanguages((s.languages || '').split(',').filter(Boolean));
      setTranslations(s.translations || {});
      setExistingImage(s.image);
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
    Object.entries(form).forEach(([key, value]) => fd.append(key, key === 'is_active' ? (value ? 'true' : 'false') : value));
    fd.append('languages', languages.join(','));
    fd.append('translations', JSON.stringify(translations));
    if (imageFile) fd.append('image', imageFile);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (isEdit) await api.put(`/scholarships/${id}`, fd, config);
      else await api.post('/scholarships', fd, config);
      navigate('/admin/scholarships');
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || 'Something went wrong.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="fw-bold mb-4">{isEdit ? 'Edit Scholarship' : 'Add Scholarship'}</h1>
      <ErrorList errors={errors} />
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm" style={{ maxWidth: 760 }}>
        <div className="mb-3">
          <label className="form-label">Title</label>
          <input type="text" name="title" maxLength={200} className="form-control" value={form.title} onChange={handleChange} required />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-4">
            <label className="form-label">Scholarship type</label>
            <select name="scholarship_type" className="form-select" value={form.scholarship_type} onChange={handleChange} required>
              <option value="">Choose...</option>
              {SCHOLARSHIP_TYPES.map((k) => <option key={k} value={k}>{ADMIN_LABELS.scholarshipType[k]}</option>)}
            </select>
          </div>
          <div className="col-sm-4">
            <label className="form-label">Funding source</label>
            <select name="funding_source" className="form-select" value={form.funding_source} onChange={handleChange} required>
              <option value="">Choose...</option>
              {FUNDING_SOURCES.map((k) => <option key={k} value={k}>{ADMIN_LABELS.fundingSource[k]}</option>)}
            </select>
          </div>
          <div className="col-sm-4">
            <label className="form-label">Study level</label>
            <select name="level" className="form-select" value={form.level} onChange={handleChange}>
              {STUDY_LEVELS.map((k) => <option key={k} value={k}>{ADMIN_LABELS.level[k]}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label d-block">Languages</label>
          <CheckboxGroup idPrefix="sch-lang" options={TEACHING_LANGUAGES.map((k) => ({ key: k, label: ADMIN_LABELS.language[k] }))} value={languages} onChange={setLanguages} />
          <div className="form-text">Tick all three for "all languages".</div>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label className="form-label">Country</label>
            <input type="text" name="country" className="form-control" value={form.country} onChange={handleChange} />
          </div>
          <div className="col-sm-6">
            <label className="form-label">University (optional)</label>
            <select name="university_id" className="form-select" value={form.university_id} onChange={handleChange}>
              <option value="">— None —</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="col-sm-6">
            <label className="form-label">Deadline (optional)</label>
            <input type="date" name="deadline" className="form-control" value={form.deadline} onChange={handleChange} />
          </div>
          <div className="col-sm-6">
            <label className="form-label">Website</label>
            <input type="url" name="website" placeholder="https://..." className="form-control" value={form.website} onChange={handleChange} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Short summary</label>
          <input type="text" name="summary" maxLength={500} className="form-control" value={form.summary} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="form-label">Funding details</label>
          <textarea name="funding_details" rows={8} className="form-control" value={form.funding_details} onChange={handleChange}
            placeholder={'Covers tuition and a monthly stipend.\n\nIncludes:\n- Tuition fee\n- Accommodation\n- Health insurance'}></textarea>
          <div className="form-text">Press Enter for a new line. Start a line with "- " to make a bullet point. Blank lines separate paragraphs. The public page keeps this layout.</div>
          {form.funding_details.trim() && (
            <div className="border rounded p-3 mt-2 bg-light">
              <div className="small text-muted mb-1">Preview</div>
              <FormattedText text={form.funding_details} />
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Image (optional)</label>
          <input type="file" accept=".jpg,.jpeg,.png,.webp" className="form-control" onChange={(e) => setImageFile(e.target.files[0])} />
          {existingImage && !imageFile && <img src={scholarshipImageUrl({ image: existingImage })} className="mt-2 rounded" style={{ height: 90 }} alt="Current" />}
        </div>

        <TranslationFields value={translations} onChange={setTranslations} fields={TRANSLATION_FIELDS} />

        <div className="form-check mb-3">
          <input type="checkbox" name="is_active" id="sch_active" className="form-check-input" checked={form.is_active} onChange={handleChange} />
          <label htmlFor="sch_active" className="form-check-label">Visible on the site</label>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Save Scholarship'}</button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin/scholarships')}>Cancel</button>
        </div>
      </form>
    </>
  );
}
