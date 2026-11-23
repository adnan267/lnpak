import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import FaqSection from '../components/FaqSection';
import { useLanguage } from '../context/LanguageContext';

export default function Contact() {
  const { user } = useAuth();
  const { t, localized } = useLanguage();
  const [searchParams] = useSearchParams();
  const preselectedSlug = searchParams.get('service') || '';
  const universityName = (searchParams.get('university') || '').slice(0, 200);
  const scholarshipName = (searchParams.get('scholarship') || '').slice(0, 200);
  const tourName = (searchParams.get('tour') || '').slice(0, 200);

  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: universityName
      ? t('uni.contactMessage', { name: universityName })
      : scholarshipName
        ? t('sch.contactMessage', { name: scholarshipName })
        : tourName
          ? t('tour.contactMessage', { name: tourName })
          : '',
    service_id: '',
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services').then(({ data }) => {
      setServices(data.services);
      if (preselectedSlug) {
        const match = data.services.find((s) => s.slug === preselectedSlug);
        if (match) setForm((f) => ({ ...f, service_id: match.id }));
      }
    });
  }, [preselectedSlug]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, full_name: user.full_name, email: user.email, phone: user.phone || '' }));
    }
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
      await api.post('/inquiries', form);
      setSuccess(t('contact.success'));
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setErrors(err.response?.data?.errors || [t('contact.error')]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-6">
            <h1 className="fw-bold">{t('contact.title')}</h1>
            <p className="text-muted">{t('contact.subtitle')}</p>
            <ul className="list-unstyled text-muted">
              <li className="mb-2"><i className="bi bi-geo-alt"></i> {t('footer.address')}</li>
              <li className="mb-2"><i className="bi bi-envelope"></i> <span dir="ltr">info@lnpak.com</span></li>
              <li><i className="bi bi-telephone"></i> <span dir="ltr">+92 300 0000000</span></li>
            </ul>
          </div>
          <div className="col-lg-6">
            {success && <div className="alert alert-success">{success}</div>}
            {errors.length > 0 && (
              <div className="alert alert-danger">
                <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
              <div className="mb-3">
                <label className="form-label">{t('contact.name')}</label>
                <input type="text" name="full_name" className="form-control" value={form.full_name} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('contact.email')}</label>
                <input type="email" name="email" dir="ltr" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('contact.phone')}</label>
                <input type="text" name="phone" dir="ltr" className="form-control" value={form.phone} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('contact.program')}</label>
                <select name="service_id" className="form-select" value={form.service_id} onChange={handleChange}>
                  <option value="">{t('contact.general')}</option>
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>{localized(s, 'title')}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">{t('contact.message')}</label>
                <textarea name="message" rows="4" className="form-control" value={form.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? t('contact.sending') : t('contact.send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
    <FaqSection page="contact" />
    </>
  );
}
