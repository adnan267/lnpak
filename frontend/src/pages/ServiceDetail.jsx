import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Price from '../components/Price';
import { useLanguage } from '../context/LanguageContext';
import { serviceImageUrl } from '../utils/imageUrl';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { t, localized, countryLabel } = useLanguage();
  const [service, setService] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setService(null);
    setNotFound(false);
    api
      .get(`/services/${slug}`)
      .then(({ data }) => setService(data.service))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h1>{t('service.notFound')}</h1>
        <Link to="/services" className="btn btn-primary mt-3">{t('service.back')}</Link>
      </div>
    );
  }

  if (!service) {
    return <div className="container py-5 text-center text-muted">{t('common.loading')}</div>;
  }

  const hasFee = service.service_fee !== null && service.service_fee !== undefined;

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            {service.country && <span className="badge badge-country mb-2">{countryLabel(service.country)}</span>}
            <h1 className="fw-bold">{localized(service, 'title')}</h1>
            <p className="lead text-muted">{localized(service, 'short_description')}</p>
            <img src={serviceImageUrl(service)} className="img-fluid rounded mb-4" alt={localized(service, 'title')} />
            <div style={{ whiteSpace: 'pre-line' }}>{localized(service, 'description')}</div>
          </div>
          <div className="col-lg-5">
            <div className="card p-4 shadow-sm">
              <h5 className="fw-bold mb-3">{t('service.interested')}</h5>
              {hasFee && (
                <p className="mb-3">
                  <span className="text-muted">{t('service.feeLabel')}: </span>
                  <strong><Price amount={service.service_fee} currency={service.fee_currency} showOriginal /></strong>
                </p>
              )}
              <p className="text-muted small">{t('service.interestedText')}</p>
              <Link to={`/contact?service=${service.slug}`} className="btn btn-primary w-100">
                {t('service.ask')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
