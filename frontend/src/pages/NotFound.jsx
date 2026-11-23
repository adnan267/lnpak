import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="container py-5 text-center">
      <h1 className="display-4 fw-bold">404</h1>
      <p className="text-muted">{t('notfound.text')}</p>
      <Link to="/" className="btn btn-primary mt-3">{t('notfound.back')}</Link>
    </div>
  );
}
