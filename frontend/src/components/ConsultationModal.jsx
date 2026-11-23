import { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const emptyForm = { full_name: '', email: '', phone: '', country_interest: '', message: '' };

/** The "Free Consultation" popup. Requests are saved as inquiries of type "consultation" in the admin panel. */
export default function ConsultationModal({ onClose }) {
  const { user } = useAuth();
  const { t, countryLabel } = useLanguage();
  const firstField = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [countries, setCountries] = useState([]);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill for logged-in visitors.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' }));
  }, [user]);

  // Offer the countries we actually have universities for.
  useEffect(() => {
    api.get('/universities').then(({ data }) => setCountries(data.countries || [])).catch(() => setCountries([]));
  }, []);

  // Close with Escape, stop the page behind from scrolling, and focus the first field.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstField.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await api.post('/inquiries', { ...form, inquiry_type: 'consultation' });
      setSuccess(t('consult.success'));
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || t('common.error')]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="consult-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="consult-dialog p-4" role="dialog" aria-modal="true" aria-labelledby="consult-title">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h4 className="fw-bold mb-0" id="consult-title">{t('consult.title')}</h4>
          <button type="button" className="btn-close" aria-label={t('common.close')} onClick={onClose}></button>
        </div>

        {success ? (
          <>
            <div className="alert alert-success mt-3">{success}</div>
            <button type="button" className="btn btn-primary w-100" onClick={onClose}>{t('common.close')}</button>
          </>
        ) : (
          <>
            <p className="text-muted">{t('consult.subtitle')}</p>

            {errors.length > 0 && (
              <div className="alert alert-danger">
                <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('contact.name')}</label>
                <input ref={firstField} type="text" name="full_name" maxLength={100} className="form-control" value={form.full_name} onChange={handleChange} required />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <label className="form-label">{t('contact.email')}</label>
                  <input type="email" name="email" dir="ltr" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">{t('contact.phone')}</label>
                  <input type="tel" name="phone" dir="ltr" maxLength={30} className="form-control" value={form.phone} onChange={handleChange} />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">{t('consult.country')}</label>
                <select name="country_interest" className="form-select" value={form.country_interest} onChange={handleChange}>
                  <option value="">{t('consult.countryAny')}</option>
                  {countries.map((c) => <option key={c} value={c}>{countryLabel(c)}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">{t('consult.message')}</label>
                <textarea name="message" rows="3" maxLength={5000} className="form-control" value={form.message} onChange={handleChange}></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? t('consult.sending') : t('consult.submit')}
              </button>
              <p className="small text-muted mt-2 mb-0">{t('consult.privacy')}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
