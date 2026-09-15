import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark site-navbar sticky-top">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          <i className="bi bi-airplane-engines"></i> LN PAK
        </NavLink>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item"><NavLink className={linkClass} to="/" end>Home</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/about">About</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/services">Services</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/contact">Contact</NavLink></li>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/admin">
                      <i className="bi bi-speedometer2"></i> Admin Panel
                    </NavLink>
                  </li>
                ) : (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/dashboard">
                      <i className="bi bi-person-circle"></i> My Account
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-light ms-lg-2" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><NavLink className={linkClass} to="/login">Login</NavLink></li>
                <li className="nav-item">
                  <NavLink className="btn btn-sm btn-warning ms-lg-2 fw-semibold" to="/register">Sign Up</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
