import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <>
      <h5 className="text-white fw-bold mb-4">
        <i className="bi bi-airplane-engines"></i> LN PAK Admin
      </h5>
      <nav className="nav flex-column gap-1">
        <NavLink className={linkClass} to="/admin" end>
          <i className="bi bi-speedometer2"></i> Dashboard
        </NavLink>
        <NavLink className={linkClass} to="/admin/services">
          <i className="bi bi-mortarboard"></i> Services
        </NavLink>
        <NavLink className={linkClass} to="/admin/universities">
          <i className="bi bi-building"></i> Universities
        </NavLink>
        <NavLink className={linkClass} to="/admin/scholarships">
          <i className="bi bi-award"></i> Scholarships
        </NavLink>
        <NavLink className={linkClass} to="/admin/tour-packages">
          <i className="bi bi-map"></i> Tour Packages
        </NavLink>
        <NavLink className={linkClass} to="/admin/faqs">
          <i className="bi bi-question-circle"></i> FAQs
        </NavLink>
        <NavLink className={linkClass} to="/admin/newsletter">
          <i className="bi bi-megaphone"></i> Newsletter
        </NavLink>
        <NavLink className={linkClass} to="/admin/inquiries">
          <i className="bi bi-envelope"></i> Inquiries
        </NavLink>
        <NavLink className={linkClass} to="/admin/users">
          <i className="bi bi-people"></i> Users
        </NavLink>
        <NavLink className={linkClass} to="/admin/settings">
          <i className="bi bi-gear"></i> Currency Settings
        </NavLink>
        <hr className="border-secondary" />
        <a href="/" target="_blank" rel="noreferrer">
          <i className="bi bi-globe"></i> View Site
        </a>
      </nav>
    </>
  );
}
