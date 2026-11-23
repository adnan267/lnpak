import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import FaqSection from '../components/FaqSection';
import Price from '../components/Price';
import { useLanguage } from '../context/LanguageContext';
import { TRANSPORT_ICONS, TRANSPORT_TYPES } from '../constants';
import { tourImageUrl } from '../utils/imageUrl';

export function TransportBadges({ transport }) {
  const { t } = useLanguage();
  const list = (transport || '').split(',').filter(Boolean);
  if (!list.length) return null;
  return (
    <span className="d-inline-flex flex-wrap gap-2">
      {list.map((type) => (
        <span key={type} className="badge text-bg-light border">
          <i className={`bi ${TRANSPORT_ICONS[type]}`}></i> {t(`transport.${type}`)}
        </span>
      ))}
    </span>
  );
}

export default function TourPackages() {
  const { t, localized, countryLabel } = useLanguage();
  const [packages, setPackages] = useState([]);
  const [transport, setTransport] = useState('');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get('/tour-packages', { params: { transport: transport || undefined } })
      .then(({ data }) => !cancelled && (setPackages(data.packages), setFailed(false)))
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [transport]);

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="fw-bold mb-2">{t('tour.title')}</h1>
          <p className="text-muted mb-4">{t('tour.subtitle')}</p>

          <div className="mb-4" style={{ maxWidth: 260 }}>
            <select className="form-select" aria-label={t('tour.filterTransport')} value={transport} onChange={(e) => setTransport(e.target.value)}>
              <option value="">{t('tour.allTransport')}</option>
              {TRANSPORT_TYPES.map((type) => <option key={type} value={type}>{t(`transport.${type}`)}</option>)}
            </select>
          </div>

          <div className="row g-4">
            {packages.map((pkg) => (
              <div className="col-md-6 col-lg-4" key={pkg.id}>
                <div className="card service-card h-100">
                  <img src={tourImageUrl(pkg)} className="card-img-top" alt={localized(pkg, 'title')} />
                  <div className="card-body d-flex flex-column">
                    <div className="mb-2">
                      {pkg.country && <span className="badge badge-country me-1">{countryLabel(pkg.country)}</span>}
                      {pkg.duration_days ? <span className="badge text-bg-light border">{t('tour.duration', { n: pkg.duration_days })}</span> : null}
                    </div>
                    <h5 className="card-title">{localized(pkg, 'title')}</h5>
                    <p className="card-text small text-muted">{localized(pkg, 'short_description')}</p>
                    <div className="mb-2"><TransportBadges transport={pkg.transport} /></div>
                    <p className="mt-auto mb-3">
                      {pkg.price !== null && pkg.price !== undefined && (
                        <strong><Price amount={pkg.price} currency={pkg.price_currency} /></strong>
                      )}
                      {localized(pkg, 'price_note') && <small className="text-muted"> {localized(pkg, 'price_note')}</small>}
                    </p>
                    <Link to={`/tour-packages/${pkg.slug}`} className="btn btn-sm btn-outline-primary align-self-start">
                      {t('common.learnMore')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && packages.length === 0 && <p className="text-muted text-center">{t('common.loading')}</p>}
          {!loading && !failed && packages.length === 0 && <p className="text-muted text-center">{t('tour.none')}</p>}
          {failed && <p className="text-danger text-center">{t('common.error')}</p>}
        </div>
      </section>
      <FaqSection page="tour-packages" />
    </>
  );
}
