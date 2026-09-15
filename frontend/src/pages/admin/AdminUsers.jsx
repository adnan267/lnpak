import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  function load() {
    api.get('/users').then(({ data }) => setUsers(data.users));
  }

  useEffect(load, []);

  async function handleToggleRole(id) {
    if (!confirm("Change this user's role?")) return;
    await api.patch(`/users/${id}/role`);
    load();
  }

  return (
    <>
      <h1 className="fw-bold mb-4">Users</h1>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>{u.role[0].toUpperCase() + u.role.slice(1)}</span></td>
                  <td className="text-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={u.id === currentUser?.id}
                      onClick={() => handleToggleRole(u.id)}
                    >
                      Make {u.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
