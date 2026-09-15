import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="d-flex">
      <div className="admin-sidebar p-3 d-flex flex-column">
        <AdminSidebar />
        <button className="btn btn-sm btn-outline-light mt-auto" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>
      <div className="flex-fill p-4">
        <Outlet />
      </div>
    </div>
  );
}
