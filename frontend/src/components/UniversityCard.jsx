import { Link } from 'react-router-dom';
import FeeDisplay from './FeeDisplay';
import { useLanguage } from '../context/LanguageContext';
import { universityImageUrl } from '../utils/imageUrl';

/** One university in a grid (Education & Scholarships page and the Home page). */
export default function UniversityCard({ university }) {
  const { t, localized, countryLabel } = useLanguage();
  const name = localized(university, 'name');
  const city = localized(university, 'city');
  const languages = (university.languages || '').split(',').filter(Boolean);
  const hasScholarship = university.scholarship_type && university.scholarship_type !== 'none';

  return (
    <div className="card service-card h-100">
      <img src={universityImageUrl(university)} className="card-img-top" alt={name} />
      <div className="card-body d-flex flex-column">
        <div className="mb-2 d-flex flex-wrap gap-1">
          <span className="badge badge-country">{countryLabel(university.country)}</span>
          {university.ranking ? (
            <span className="badge text-bg-light border">{t('uni.rankShort', { n: university.ranking })}</span>
          ) : null}
          {hasScholarship && (
            <span className="badge badge-scholarship">{t(`sch.type.${university.scholarship_type}`)}</span>
          )}
        </div>
        <h5 className="card-title">{name}</h5>
        {city && <p className="small text-muted mb-1"><i className="bi bi-geo-alt"></i> {city}</p>}
        {languages.length > 0 && (
          <p className="small text-muted mb-2">
            <i className="bi bi-translate"></i> {languages.map((l) => t(`lang.${l}`)).join(', ')}
          </p>
        )}
        <p className="small mb-3 mt-auto">
          <span className="text-muted">{t('uni.tuition')}: </span>
          <FeeDisplay university={university} />
        </p>
        <Link to={`/universities/${university.slug}`} className="btn btn-sm btn-outline-primary align-self-start">
          {t('common.learnMore')}
        </Link>
      </div>
    </div>
  );
}
