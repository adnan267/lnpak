import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { ADMIN_LABELS } from '../../constants';

export default function AdminInquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/inquiries', { params: { status: status || undefined, type: type || undefined } }).then(({ data }) => {
      setInquiries(data.inquiries);
      setLoading(false);
    });
  }

  useEffect(load, [status, type]);

  async function handleStatusChange(id, newStatus) {
    await api.patch(`/inquiries/${id}`, { status: newStatus });
    load();
  }

  function setFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Inquiries</h1>
        <div className="d-flex gap-2 flex-wrap">
        <select className="form-select form-select-sm" style={{ width: 190 }} value={type} onChange={(e) => setFilter('type', e.target.value)}>
          <option value="">All types</option>
          {Object.entries(ADMIN_LABELS.inquiryType).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <div className="btn-group">
          <button className={`btn btn-sm btn-outline-secondary ${status === '' ? 'active' : ''}`} onClick={() => setFilter('status', '')}>All</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'new' ? 'active' : ''}`} onClick={() => setFilter('status', 'new')}>New</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'contacted' ? 'active' : ''}`} onClick={() => setFilter('status', 'contacted')}>Contacted</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'closed' ? 'active' : ''}`} onClick={() => setFilter('status', 'closed')}>Closed</button>
        </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Date</th><th>Type</th><th>Name</th><th>Contact</th><th>Program</th><th>Message</th><th>Status</th></tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id}>
                  <td className="text-nowrap">{new Date(inq.created_at).toLocaleDateString()}</td>
                  <td><span className="badge text-bg-light border">{ADMIN_LABELS.inquiryType[inq.inquiry_type] || 'General'}</span></td>
                  <td>{inq.full_name}</td>
                  <td className="small">{inq.email}<br />{inq.phone}</td>
                  <td>{inq.service_title || 'General'}{inq.country_interest && <div className="small text-muted">Country: {inq.country_interest}</div>}</td>
                  <td className="small" style={{ maxWidth: 220 }}>{inq.message?.length > 100 ? inq.message.slice(0, 100) + '...' : inq.message}</td>
                  <td>
                    <select className="form-select form-select-sm" value={inq.status} onChange={(e) => handleStatusChange(inq.id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && inquiries.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No inquiries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
