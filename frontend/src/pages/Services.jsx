import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import FaqSection from '../components/FaqSection';
import { useLanguage } from '../context/LanguageContext';
import { serviceImageUrl } from '../utils/imageUrl';

export default function Services() {
  const { t, localized, countryLabel } = useLanguage();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services').then(({ data }) => {
      setServices(data.services);
      setLoading(false);
    });
  }, []);

  return (
    <>
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-2">{t('services.title')}</h1>
        <p className="text-muted mb-4">{t('services.subtitle')}</p>

        <div className="row g-4">
          {services.map((service) => (
            <div className="col-md-6 col-lg-4" key={service.id}>
              <div className="card service-card">
                <img src={serviceImageUrl(service)} className="card-img-top" alt={localized(service, 'title')} />
                <div className="card-body">
                  {service.country && <span className="badge badge-country mb-2">{countryLabel(service.country)}</span>}
                  <h5 className="card-title">{localized(service, 'title')}</h5>
                  <p className="card-text small text-muted">{localized(service, 'short_description')}</p>
                  <Link to={`/services/${service.slug}`} className="btn btn-sm btn-outline-primary">{t('common.learnMore')}</Link>
                </div>
              </div>
            </div>
          ))}
          {!loading && services.length === 0 && <p className="text-muted">{t('services.none')}</p>}
        </div>
      </div>
    </section>
    <FaqSection page="services" />
    </>
  );
}
