import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { ADMIN_LABELS } from '../../constants';

export default function AdminScholarships() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  function load() {
    api.get('/scholarships?all=1').then(({ data }) => {
      setItems(data.scholarships);
      setLoading(false);
    });
  }
  useEffect(load, []);

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.delete(`/scholarships/${id}`);
    load();
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => [s.title, s.country, s.university_name].some((v) => (v || '').toLowerCase().includes(q)));
  }, [items, search]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Scholarships</h1>
        <Link to="/admin/scholarships/new" className="btn btn-primary"><i className="bi bi-plus-lg"></i> Add Scholarship</Link>
      </div>
      <input type="search" className="form-control mb-3" style={{ maxWidth: 360 }} placeholder="Search by title, country or university" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Title</th><th>Type</th><th>Source</th><th>Country</th><th>Deadline</th><th>Status</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="fw-semibold">{s.title}{s.university_name && <div className="small text-muted">{s.university_name}</div>}</td>
                  <td>{ADMIN_LABELS.scholarshipType[s.scholarship_type]}</td>
                  <td>{ADMIN_LABELS.fundingSource[s.funding_source]}</td>
                  <td>{s.country || '—'}</td>
                  <td className="text-nowrap">{s.deadline ? String(s.deadline).slice(0, 10) : '—'}</td>
                  <td>{s.is_active ? <span className="badge bg-success">Active</span> : <span className="badge bg-secondary">Hidden</span>}</td>
                  <td className="text-end text-nowrap">
                    <Link to={`/admin/scholarships/${s.id}/edit`} className="btn btn-sm btn-outline-secondary"><i className="bi bi-pencil"></i></Link>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(s.id, s.title)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No scholarships found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
