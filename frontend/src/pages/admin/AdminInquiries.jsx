import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

export default function AdminInquiries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/inquiries', { params: status ? { status } : {} }).then(({ data }) => {
      setInquiries(data.inquiries);
      setLoading(false);
    });
  }

  useEffect(load, [status]);

  async function handleStatusChange(id, newStatus) {
    await api.patch(`/inquiries/${id}`, { status: newStatus });
    load();
  }

  function setFilter(value) {
    setSearchParams(value ? { status: value } : {});
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fw-bold mb-0">Inquiries</h1>
        <div className="btn-group">
          <button className={`btn btn-sm btn-outline-secondary ${status === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>New</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'contacted' ? 'active' : ''}`} onClick={() => setFilter('contacted')}>Contacted</button>
          <button className={`btn btn-sm btn-outline-secondary ${status === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>Closed</button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Date</th><th>Name</th><th>Contact</th><th>Program</th><th>Message</th><th>Status</th></tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq.id}>
                  <td className="text-nowrap">{new Date(inq.created_at).toLocaleDateString()}</td>
                  <td>{inq.full_name}</td>
                  <td className="small">{inq.email}<br />{inq.phone}</td>
                  <td>{inq.service_title || 'General'}</td>
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
                <tr><td colSpan={6} className="text-center text-muted py-4">No inquiries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
