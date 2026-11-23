import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
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
      const user = await login(form.email, form.password);
      const redirectTo = location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setErrors(err.response?.data?.errors || [t('auth.invalid')]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="card auth-card p-4">
        <h3 className="fw-bold text-center mb-3">{t('auth.loginTitle')}</h3>

        {errors.length > 0 && (
          <div className="alert alert-danger">
            <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">{t('auth.email')}</label>
            <input type="email" name="email" dir="ltr" className="form-control" value={form.email} onChange={handleChange} required />
          </div>
          <div className="mb-3">
            <label className="form-label">{t('auth.password')}</label>
            <input type="password" name="password" dir="ltr" className="form-control" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? t('auth.loggingIn') : t('auth.loginBtn')}
          </button>
        </form>
        <p className="text-center mt-3 mb-0 small">
          {t('auth.noAccount')} <Link to="/register">{t('auth.signupLink')}</Link>
        </p>
      </div>
    </div>
  );
}
