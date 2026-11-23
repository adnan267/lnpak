import FaqSection from '../components/FaqSection';
import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  return (
    <>
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-4">{t('about.title')}</h1>
        <div className="row g-4">
          <div className="col-lg-8">
            <p className="lead">{t('about.lead')}</p>
            <p>{t('about.p2')}</p>
            <h5 className="mt-4">{t('about.whatWeDo')}</h5>
            <ul>
              <li>{t('about.w1')}</li>
              <li>{t('about.w2')}</li>
              <li>{t('about.w3')}</li>
              <li>{t('about.w4')}</li>
            </ul>
          </div>
          <div className="col-lg-4">
            <div className="card p-4 shadow-sm">
              <h5 className="fw-bold">{t('about.whyTitle')}</h5>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> {t('about.y1')}</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> {t('about.y2')}</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> {t('about.y3')}</li>
                <li><i className="bi bi-check-circle-fill text-success"></i> {t('about.y4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
    <FaqSection page="about" />
    </>
  );
}
