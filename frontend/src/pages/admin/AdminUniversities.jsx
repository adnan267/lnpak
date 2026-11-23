import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminUniversities() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  function load() {
    api.get('/universities?all=1').then(({ data }) => {
      setUniversities(data.universities);
      setLoading(false);
    });
  }

  useEffect(load, []);

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await api.delete(`/universities/${id}`);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter((u) =>
      [u.name, u.country, u.city].some((value) => (value || '').toLowerCase().includes(q))
    );
  }, [universities, search]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Universities</h1>
        <Link to="/admin/universities/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i> Add University</Link>
      </div>

      <input
        type="search"
        className="form-control mb-3"
        style={{ maxWidth: 360 }}
        placeholder="Search by name, country or city"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Country / City</th><th>Tuition / year</th><th>Status</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td>{u.country}{u.city ? ` · ${u.city}` : ''}</td>
                  <td className="text-nowrap">
                    {u.fee_mode === 'text' && (u.fee_text || <span className="text-muted">Not set</span>)}
                    {u.fee_mode === 'single' && `${u.fee_currency} ${Number(u.tuition_fee).toLocaleString('en-US')}`}
                    {u.fee_mode === 'range' && `${u.fee_currency} ${Number(u.tuition_fee).toLocaleString('en-US')} – ${Number(u.tuition_fee_max).toLocaleString('en-US')}`}
                    {u.fee_mode === 'none' && <span className="text-muted">Not set</span>}
                  </td>
                  <td>{u.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Hidden</span>}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/universities/${u.id}/edit`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></Link>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id, u.name)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-4">No universities found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
