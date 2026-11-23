import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import FeeDisplay from '../components/FeeDisplay';
import FormattedText from '../components/FormattedText';
import { useLanguage } from '../context/LanguageContext';
import { universityImageUrl } from '../utils/imageUrl';

export default function UniversityDetail() {
  const { slug } = useParams();
  const { t, localized, countryLabel } = useLanguage();
  const [university, setUniversity] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setUniversity(null);
    setNotFound(false);
    api
      .get(`/universities/${slug}`)
      .then(({ data }) => setUniversity(data.university))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h1>{t('uni.notFound')}</h1>
        <Link to="/education-scholarships" className="btn btn-primary mt-3">{t('uni.back')}</Link>
      </div>
    );
  }

  if (!university) {
    return <div className="container py-5 text-center text-muted">{t('common.loading')}</div>;
  }

  const name = localized(university, 'name');
  const city = localized(university, 'city');
  const languages = (university.languages || '').split(',').filter(Boolean);
  const hasScholarship = university.scholarship_type && university.scholarship_type !== 'none';
  const hasNumbers = university.tuition_fee !== null && university.tuition_fee !== undefined;

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <span className="badge badge-country mb-2">{countryLabel(university.country)}</span>
            <h1 className="fw-bold">{name}</h1>
            {city && <p className="lead text-muted"><i className="bi bi-geo-alt"></i> {city}</p>}
            <img src={universityImageUrl(university)} className="img-fluid rounded mb-4" alt={name} />
            <FormattedText text={localized(university, 'description')} />
          </div>

          <div className="col-lg-5">
            <div className="card p-4 shadow-sm">
              <dl className="mb-3">
                <dt className="text-muted small fw-normal">{t('uni.tuition')}</dt>
                <dd className="fs-5 mb-3">
                  <FeeDisplay university={university} showOriginal />
                </dd>

                {hasScholarship && (
                  <>
                    <dt className="text-muted small fw-normal">{t('uni.scholarship')}</dt>
                    <dd className="mb-3">
                      <span className="badge badge-scholarship me-1">{t(`sch.type.${university.scholarship_type}`)}</span>
                      <span className="badge text-bg-light border">{t(`sch.source.${university.scholarship_source}`)}</span>
                    </dd>
                  </>
                )}

                {languages.length > 0 && (
                  <>
                    <dt className="text-muted small fw-normal">{t('uni.languages')}</dt>
                    <dd className="mb-3">{languages.map((l) => t(`lang.${l}`)).join(', ')}</dd>
                  </>
                )}

                {university.ranking ? (
                  <>
                    <dt className="text-muted small fw-normal">{t('uni.ranking')}</dt>
                    <dd className="mb-3">{t('uni.rankShort', { n: university.ranking })}</dd>
                  </>
                ) : null}

                {localized(university, 'intake') ? (
                  <>
                    <dt className="text-muted small fw-normal">{t('uni.intake')}</dt>
                    <dd className="mb-3">{localized(university, 'intake')}</dd>
                  </>
                ) : null}

                {university.website ? (
                  <>
                    <dt className="text-muted small fw-normal">{t('uni.website')}</dt>
                    <dd className="mb-0">
                      <a href={university.website} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-break">
                        {university.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </dd>
                  </>
                ) : null}
              </dl>

              {hasNumbers && <p className="text-muted small">{t('uni.feeNote')}</p>}
              <p className="text-muted small">{t('uni.askText')}</p>
              <Link to={`/contact?university=${encodeURIComponent(university.name)}`} className="btn btn-primary w-100">
                {t('uni.ask')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
