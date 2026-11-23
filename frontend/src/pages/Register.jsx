import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setErrors(err.response?.data?.errors || [t('contact.error')]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card auth-card p-4">
        <h3 className="fw-bold text-center mb-3">{t('auth.registerTitle')}</h3>

        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">{t('auth.fullName')}</label>
            <input type="text" name="full_name" className="form-control" value={form.full_name} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">{t('auth.email')}</label>
            <input type="email" name="email" dir="ltr" className="form-control" value={form.email} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">{t('auth.phone')}</label>
            <input type="text" name="phone" dir="ltr" className="form-control" value={form.phone} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">{t('auth.password')}</label>
            <input type="password" name="password" dir="ltr" className="form-control" value={form.password} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">{t('auth.confirm')}</label>
            <input type="password" name="confirm_password" dir="ltr" className="form-control" value={form.confirm_password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? t('auth.creating') : t('auth.signupBtn')}
          </button>
        </form>
        <p className="text-center mt-3 mb-0 small">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
