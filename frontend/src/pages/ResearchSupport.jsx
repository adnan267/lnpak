import { useEffect, useState } from 'react';
import api from '../api/axios';
import FaqSection from '../components/FaqSection';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SERVICE_ICONS = ['bi-journal-text', 'bi-pencil-square', 'bi-check2-square', 'bi-file-earmark-person', 'bi-chat-dots', 'bi-graph-up-arrow'];

export default function ResearchSupport() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' }));
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/inquiries', { ...form, inquiry_type: 'research' });
      setSuccess(t('contact.success'));
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setErrors(err.response?.data?.errors || [err.response?.data?.message || t('common.error')]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="fw-bold mb-2">{t('research.title')}</h1>
          <p className="lead text-muted mb-5">{t('research.subtitle')}</p>

          <div className="row g-4 mb-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div className="col-md-6 col-lg-4" key={n}>
                <div className="card h-100 shadow-sm p-3">
                  <i className={`bi ${SERVICE_ICONS[n - 1]} fs-2 text-primary`}></i>
                  <h5 className="mt-2">{t(`research.s${n}Title`)}</h5>
                  <p className="text-muted small mb-0">{t(`research.s${n}Text`)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-7">
              <h3 className="fw-bold">{t('research.formTitle')}</h3>
              <p className="text-muted">{t('research.formText')}</p>

              {success && <div className="alert alert-success">{success}</div>}
              {errors.length > 0 && (
                <div className="alert alert-danger">
                  <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                </div>
              )}

              <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                <div className="mb-3">
                  <label className="form-label">{t('contact.name')}</label>
                  <input type="text" name="full_name" maxLength={100} className="form-control" value={form.full_name} onChange={handleChange} required />
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
                  <label className="form-label">{t('research.message')}</label>
                  <textarea name="message" rows="5" maxLength={5000} className="form-control" value={form.message} onChange={handleChange} required></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting ? t('contact.sending') : t('research.send')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <FaqSection page="research-support" />
    </>
  );
}
