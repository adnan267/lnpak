import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useConsultation } from '../context/ConsultationContext';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { t } = useLanguage();
  const { open: openConsultation } = useConsultation();

  return (
    <footer className="site-footer mt-5 pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-4">
            <h5 className="fw-bold text-white">LN PAK</h5>
            <p className="text-white-50">{t('footer.tagline')}</p>
          </div>
          <div className="col-md-4">
            <h6 className="text-white fw-semibold">{t('footer.quick')}</h6>
            <ul className="list-unstyled">
              <li><Link to="/">{t('nav.home')}</Link></li>
              <li><Link to="/about">{t('nav.about')}</Link></li>
              <li><Link to="/services">{t('nav.services')}</Link></li>
              <li><Link to="/education-scholarships">{t('nav.education')}</Link></li>
              <li><Link to="/tour-packages">{t('nav.tours')}</Link></li>
              <li><Link to="/academic-research-support">{t('nav.research')}</Link></li>
              <li><Link to="/faq">{t('nav.faq')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
              <li><button type="button" className="btn btn-link p-0 text-start" onClick={openConsultation}>{t('nav.consultation')}</button></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="text-white fw-semibold">{t('footer.contact')}</h6>
            <ul className="list-unstyled text-white-50">
              <li><i className="bi bi-geo-alt"></i> {t('footer.address')}</li>
              <li><i className="bi bi-envelope"></i> <span dir="ltr">info@lnpak.com</span></li>
              <li><i className="bi bi-telephone"></i> <span dir="ltr">+92 300 0000000</span></li>
            </ul>
            <NewsletterForm />
          </div>
        </div>
        <hr className="border-secondary" />
        <p className="text-center text-white-50 mb-0 small">
          &copy; {new Date().getFullYear()} LN PAK. {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
