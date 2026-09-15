import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get('/services?all=1').then(({ data }) => {
      setServices(data.services);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    await api.delete(`/services/${id}`);
    load();
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Services</h1>
        <Link to="/admin/services/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i> Add Service</Link>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Title</th><th>Country</th><th>Status</th><th>Added</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id}>
                  <td className="fw-semibold">{s.title}</td>
                  <td>{s.country}</td>
                  <td>{s.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Hidden</span>}</td>
                  <td className="text-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    <Link to={`/admin/services/${s.id}/edit`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></Link>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && services.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No services yet. Click "Add Service" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
