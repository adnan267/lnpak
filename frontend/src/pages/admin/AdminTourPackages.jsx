import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { ADMIN_LABELS } from '../../constants';

export default function AdminTourPackages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  function load() {
    api.get('/tour-packages?all=1').then(({ data }) => {
      setItems(data.packages);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.delete(`/tour-packages/${id}`);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => [p.title, p.country, p.destination].some((v) => (v || '').toLowerCase().includes(q)));
  }, [items, search]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Tour Packages</h1>
        <Link to="/admin/tour-packages/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i> Add Package</Link>
      </div>
      <input type="search" className="form-control mb-3" style={{ maxWidth: 360 }} placeholder="Search by title, country or destination" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Title</th><th>Country</th><th>Transport</th><th>Hotels</th><th>Price</th><th>Status</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="fw-semibold">{p.title}</td>
                  <td>{p.country || '—'}</td>
                  <td className="small">{(p.transport || '').split(',').filter(Boolean).map((k) => ADMIN_LABELS.transport[k]).join(', ') || '—'}</td>
                  <td>{p.hotels.length || <span className="text-muted">None</span>}</td>
                  <td className="text-nowrap">{p.price === null || p.price === undefined ? '—' : `${p.price_currency} ${Number(p.price).toLocaleString('en-US')}`}</td>
                  <td>{p.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Hidden</span>}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/tour-packages/${p.id}/edit`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></Link>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id, p.title)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No tour packages found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
