import { useState } from 'react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

/** Newsletter sign-up box (used in the footer). Subscribers appear in Admin > Newsletter. */
export default function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setSubmitting(true);
    try {
      await api.post('/newsletter/subscribe', { email });
      setStatus({ type: 'success', text: t('news.success') });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'danger', text: err.response?.data?.errors?.[0] || err.response?.data?.message || t('common.error') });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false}>
      <h6 className="text-white fw-semibold">{t('news.title')}</h6>
      <p className="text-white-50 small mb-2">{t('news.text')}</p>
      <div className="input-group input-group-sm">
        <input
          type="email"
          dir="ltr"
          className="form-control"
          placeholder={t('news.email')}
          aria-label={t('news.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-warning fw-semibold" disabled={submitting}>
          {submitting ? t('news.sending') : t('news.button')}
        </button>
      </div>
      {status.text && (
        <div className={`small mt-2 text-${status.type === 'success' ? 'success' : 'warning'}`} role="status">{status.text}</div>
      )}
    </form>
  );
}
