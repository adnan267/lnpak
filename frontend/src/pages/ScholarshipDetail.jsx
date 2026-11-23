import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import FormattedText from '../components/FormattedText';
import { formatDeadline } from '../components/ScholarshipCard';
import { useLanguage } from '../context/LanguageContext';
import { scholarshipImageUrl } from '../utils/imageUrl';

export default function ScholarshipDetail() {
  const { slug } = useParams();
  const { t, lang, localized, countryLabel } = useLanguage();
  const [scholarship, setScholarship] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setScholarship(null);
    setNotFound(false);
    api
      .get(`/scholarships/${slug}`)
      .then(({ data }) => setScholarship(data.scholarship))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h1>{t('sch.notFound')}</h1>
        <Link to="/education-scholarships?tab=scholarships" className="btn btn-primary mt-3">{t('sch.back')}</Link>
      </div>
    );
  }

  if (!scholarship) {
    return <div className="container py-5 text-center text-muted">{t('common.loading')}</div>;
  }

  const title = localized(scholarship, 'title');
  const languages = (scholarship.languages || '').split(',').filter(Boolean);
  const deadline = formatDeadline(scholarship.deadline, lang);
  const details = localized(scholarship, 'funding_details');

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <div className="mb-2 d-flex flex-wrap gap-1">
              <span className="badge badge-scholarship">{t(`sch.type.${scholarship.scholarship_type}`)}</span>
              <span className="badge text-bg-light border">{t(`sch.source.${scholarship.funding_source}`)}</span>
              {scholarship.country && <span className="badge badge-country">{countryLabel(scholarship.country)}</span>}
            </div>
            <h1 className="fw-bold">{title}</h1>
            <p className="lead text-muted">{localized(scholarship, 'summary')}</p>
            {scholarship.image && (
              <img src={scholarshipImageUrl(scholarship)} className="img-fluid rounded mb-4" alt={title} />
            )}

            {details && (
              <>
                <h4 className="fw-bold">{t('sch.fundingDetails')}</h4>
                {/* Paragraph breaks and bullet points typed in the admin editor are kept here */}
                <FormattedText text={details} />
              </>
            )}
          </div>

          <div className="col-lg-5">
            <div className="card p-4 shadow-sm">
              <dl className="mb-3">
                <dt className="text-muted small fw-normal">{t('sch.type')}</dt>
                <dd className="mb-3">{t(`sch.type.${scholarship.scholarship_type}`)}</dd>

                <dt className="text-muted small fw-normal">{t('sch.source')}</dt>
                <dd className="mb-3">{t(`sch.source.${scholarship.funding_source}`)}</dd>

                <dt className="text-muted small fw-normal">{t('sch.level')}</dt>
                <dd className="mb-3">{t(`level.${scholarship.level}`)}</dd>

                <dt className="text-muted small fw-normal">{t('sch.languages')}</dt>
                <dd className="mb-3">{languages.map((l) => t(`lang.${l}`)).join(', ')}</dd>

                {scholarship.university_name && (
                  <>
                    <dt className="text-muted small fw-normal">{t('sch.university')}</dt>
                    <dd className="mb-3">
                      <Link to={`/universities/${scholarship.university_slug}`}>{scholarship.university_name}</Link>
                    </dd>
                  </>
                )}

                <dt className="text-muted small fw-normal">{t('sch.deadline')}</dt>
                <dd className={scholarship.website ? 'mb-3' : 'mb-0'}>{deadline || t('sch.noDeadline')}</dd>

                {scholarship.website && (
                  <>
                    <dt className="text-muted small fw-normal">{t('sch.website')}</dt>
                    <dd className="mb-0">
                      <a href={scholarship.website} target="_blank" rel="noopener noreferrer" dir="ltr" className="text-break">
                        {scholarship.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </dd>
                  </>
                )}
              </dl>

              <p className="text-muted small">{t('sch.askText')}</p>
              <Link to={`/contact?scholarship=${encodeURIComponent(scholarship.title)}`} className="btn btn-primary w-100">
                {t('sch.ask')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
