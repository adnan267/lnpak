import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { scholarshipImageUrl } from '../utils/imageUrl';

export function formatDeadline(deadline, lang) {
  if (!deadline) return null;
  // The API sends 'YYYY-MM-DD' (or a full ISO string); show it as a plain calendar date without time-zone shifts.
  const [y, m, d] = String(deadline).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

/** One scholarship in a grid. */
export default function ScholarshipCard({ scholarship }) {
  const { t, lang, localized, countryLabel } = useLanguage();
  const title = localized(scholarship, 'title');
  const deadline = formatDeadline(scholarship.deadline, lang);
  const languages = (scholarship.languages || '').split(',').filter(Boolean);

  return (
    <div className="card service-card h-100">
      <img src={scholarshipImageUrl(scholarship)} className="card-img-top" alt={title} />
      <div className="card-body d-flex flex-column">
        <div className="mb-2 d-flex flex-wrap gap-1">
          <span className="badge badge-scholarship">{t(`sch.type.${scholarship.scholarship_type}`)}</span>
          <span className="badge text-bg-light border">{t(`sch.source.${scholarship.funding_source}`)}</span>
          {scholarship.country && <span className="badge badge-country">{countryLabel(scholarship.country)}</span>}
        </div>
        <h5 className="card-title">{title}</h5>
        {scholarship.university_name && (
          <p className="small text-muted mb-1"><i className="bi bi-building"></i> {scholarship.university_name}</p>
        )}
        <p className="card-text small text-muted">{localized(scholarship, 'summary')}</p>
        <div className="small text-muted mt-auto mb-3">
          {languages.length > 0 && (
            <div><i className="bi bi-translate"></i> {languages.map((l) => t(`lang.${l}`)).join(', ')}</div>
          )}
          <div><i className="bi bi-calendar-event"></i> {t('sch.deadline')}: {deadline || t('sch.noDeadline')}</div>
        </div>
        <Link to={`/scholarships/${scholarship.slug}`} className="btn btn-sm btn-outline-primary align-self-start">
          {t('common.learnMore')}
        </Link>
      </div>
    </div>
  );
}
