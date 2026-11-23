import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import FaqSection from '../components/FaqSection';
import UniversityCard from '../components/UniversityCard';
import { useLanguage } from '../context/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import { serviceImageUrl } from '../utils/imageUrl';

export default function Home() {
  const { t, localized, countryLabel } = useLanguage();
  const { open: openConsultation } = useConsultation();
  const [services, setServices] = useState([]);
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data.services.slice(0, 4)));
    api
      .get('/universities')
      .then(({ data }) => setUniversities(data.universities.slice(0, 6)))
      .catch(() => setUniversities([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container text-center">
          <h1 className="display-5 mb-3">{t('home.heroTitle')}</h1>
          <p className="lead mb-4">{t('home.heroSubtitle')}</p>
          <button type="button" className="btn btn-primary btn-lg px-4 m-1" onClick={openConsultation}>{t('home.ctaConsult')}</button>
          <Link to="/academic-research-support" className="btn btn-warning btn-lg px-4 m-1">{t('home.ctaResearch')}</Link>
          <Link to="/education-scholarships" className="btn btn-outline-light btn-lg px-4 m-1">{t('home.ctaExplore')}</Link>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">{t('home.destinationsTitle')}</h2>
            <p className="text-muted">{t('home.destinationsSubtitle')}</p>
          </div>
          <div className="row g-4">
            {services.map((service) => (
              <div className="col-md-6 col-lg-3" key={service.id}>
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
            {services.length === 0 && (
              <p className="text-muted text-center">{t('home.noServices')}</p>
            )}
          </div>
        </div>
      </section>

      {universities.length > 0 && (
        <section className="py-5 bg-light">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">{t('home.uniTitle')}</h2>
              <p className="text-muted">{t('home.uniSubtitle')}</p>
            </div>
            <div className="row g-4">
              {universities.map((university) => (
                <div className="col-md-6 col-lg-4" key={university.id}>
                  <UniversityCard university={university} />
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link to="/education-scholarships" className="btn btn-primary">{t('home.viewAllUnis')}</Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-5">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <i className="bi bi-mortarboard display-5 text-primary"></i>
              <h5 className="mt-3">{t('home.f1Title')}</h5>
              <p className="text-muted small">{t('home.f1Text')}</p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-file-earmark-text display-5 text-primary"></i>
              <h5 className="mt-3">{t('home.f2Title')}</h5>
              <p className="text-muted small">{t('home.f2Text')}</p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-headset display-5 text-primary"></i>
              <h5 className="mt-3">{t('home.f3Title')}</h5>
              <p className="text-muted small">{t('home.f3Text')}</p>
            </div>
          </div>
        </div>
      </section>

      <FaqSection page="home" />
    </>
  );
}
