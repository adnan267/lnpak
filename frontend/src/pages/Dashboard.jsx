import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const badgeClass = { new: 'bg-primary', contacted: 'bg-warning', closed: 'bg-secondary' };

export default function Dashboard() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inquiries/mine').then(({ data }) => {
      setInquiries(data.inquiries);
      setLoading(false);
    });
  }, []);

  // "-u-nu-latn" keeps normal 0-9 digits for Russian and Chinese visitors.
  const dateLocale = lang === 'en' ? undefined : `${lang}-u-nu-latn`;

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-1">{t('dashboard.welcome', { name: user?.full_name })}</h1>
        <p className="text-muted mb-4">{t('dashboard.subtitle')}</p>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>{t('dashboard.date')}</th>
                  <th>{t('dashboard.program')}</th>
                  <th>{t('dashboard.message')}</th>
                  <th>{t('dashboard.status')}</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td className="text-nowrap">{new Date(inq.created_at).toLocaleDateString(dateLocale)}</td>
                    <td>{inq.service_title || t('dashboard.general')}</td>
                    <td className="small">{inq.message?.length > 80 ? inq.message.slice(0, 80) + '...' : inq.message}</td>
                    <td>
                      <span className={`badge ${badgeClass[inq.status] || 'bg-secondary'}`}>
                        {t(`status.${inq.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && inquiries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      {t('dashboard.empty')} <Link to="/contact">{t('dashboard.contactUs')}</Link> {t('dashboard.contactUsAfter')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
