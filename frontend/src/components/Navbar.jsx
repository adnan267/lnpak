import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LocaleSwitchers from './LocaleSwitchers';
import { useConsultation } from '../context/ConsultationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { open: openConsultation } = useConsultation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="navbar navbar-expand-xl navbar-dark site-navbar sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          <i className="bi bi-airplane-engines"></i> LN PAK
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="mainNav">
          <ul className="navbar-nav ms-auto align-items-xl-center gap-xl-2">
            <li className="nav-item"><NavLink className={linkClass} to="/" end>{t('nav.home')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/about">{t('nav.about')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/services">{t('nav.services')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/education-scholarships">{t('nav.education')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/tour-packages">{t('nav.tours')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/academic-research-support">{t('nav.research')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/faq">{t('nav.faq')}</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/contact">{t('nav.contact')}</NavLink></li>
            <li className="nav-item my-2 my-xl-0">
              <button type="button" className="btn btn-sm btn-primary fw-semibold" onClick={openConsultation}>
                {t('nav.consultation')}
              </button>
            </li>
            <li className="nav-item my-2 my-xl-0 ms-xl-2"><LocaleSwitchers /></li>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/admin">
                      <i className="bi bi-speedometer2"></i> {t('nav.admin')}
                    </NavLink>
                  </li>
                ) : (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/dashboard">
                      <i className="bi bi-person-circle"></i> {t('nav.account')}
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light ms-xl-2" onClick={handleLogout}>
                    {t('nav.logout')}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className={linkClass} to="/login">{t('nav.login')}</NavLink></li>
                <li className="nav-item">
                  <NavLink className="btn btn-sm btn-warning ms-xl-2 fw-semibold" to="/register">{t('nav.signup')}</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
