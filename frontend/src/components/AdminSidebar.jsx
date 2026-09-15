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
        <NavLink className={linkClass} to="/admin/inquiries">
          <i className="bi bi-envelope"></i> Inquiries
        </NavLink>
        <NavLink className={linkClass} to="/admin/users">
          <i className="bi bi-people"></i> Users
        </NavLink>
        <hr className="border-secondary" />
        <a href="/" target="_blank" rel="noreferrer">
          <i className="bi bi-globe"></i> View Site
        </a>
      </nav>
    </>
  );
}
