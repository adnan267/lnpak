import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminNewsletter() {
  const [subs, setSubs] = useState([]);
  const [counts, setCounts] = useState({ total: 0, subscribed: 0 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/newsletter', { params: { q: q || undefined, status: status || undefined } })
      .then(({ data }) => {
        setSubs(data.subscribers);
        setCounts({ total: data.total, subscribed: data.subscribed });
      })
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [q, status]);

  async function toggle(s) {
    await api.patch(`/newsletter/${s.id}`, { status: s.status === 'subscribed' ? 'unsubscribed' : 'subscribed' });
    load();
  }
  async function remove(s) {
    if (!confirm(`Delete ${s.email}?`)) return;
    await api.delete(`/newsletter/${s.id}`);
    load();
  }
  async function exportCsv() {
    const { data } = await api.get('/newsletter/export', { responseType: 'blob', params: { status: status === '' ? undefined : status } });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-0">Newsletter Subscribers</h1>
          <div className="text-muted small">{counts.subscribed} subscribed · {counts.total} total</div>
        </div>
        <button className="btn btn-outline-primary" onClick={exportCsv}><i className="bi bi-download"></i> Download CSV</button>
      </div>
      <div className="d-flex gap-2 mb-3">
        <input type="search" className="form-control" style={{ maxWidth: 320 }} placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="form-select" style={{ maxWidth: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
      </div>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light"><tr><th>Email</th><th>Name</th><th>Date</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.name || '—'}</td>
                  <td className="text-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>{s.status === 'subscribed' ? <span className="badge bg-success">Subscribed</span> : <span className="badge bg-secondary">Unsubscribed</span>}</td>
                  <td className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggle(s)}>{s.status === 'subscribed' ? 'Unsubscribe' : 'Resubscribe'}</button>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(s)}><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
              {!loading && subs.length === 0 && <tr><td colSpan={5} className="text-center text-muted py-4">No subscribers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
