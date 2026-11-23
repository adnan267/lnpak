import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <div className="text-muted">Loading...</div>;

  return (
    <>
      <h1 className="fw-bold mb-4">Dashboard</h1>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Total Services</div>
            <div className="fs-3 fw-bold">{stats.totalServices}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Total Universities</div>
            <div className="fs-3 fw-bold">{stats.totalUniversities}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Total Inquiries</div>
            <div className="fs-3 fw-bold">{stats.totalInquiries}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">New Inquiries</div>
            <div className="fs-3 fw-bold text-primary">{stats.newInquiries}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Scholarships</div>
            <div className="fs-3 fw-bold">{stats.totalScholarships ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Tour Packages</div>
            <div className="fs-3 fw-bold">{stats.totalTourPackages ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Newsletter Subscribers</div>
            <div className="fs-3 fw-bold">{stats.totalSubscribers ?? 0}</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card stat-card p-3">
            <div className="text-muted small">Registered Users</div>
            <div className="fs-3 fw-bold">{stats.totalUsers}</div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-white fw-semibold">Recent Inquiries</div>
        <div className="table-responsive">
          <table className="table mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Date</th><th>Name</th><th>Program</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stats.recentInquiries.map((inq) => (
                <tr key={inq.id}>
                  <td className="text-nowrap">{new Date(inq.created_at).toLocaleDateString()}</td>
                  <td>{inq.full_name}</td>
                  <td>{inq.service_title || 'General'}</td>
                  <td><span className="badge bg-secondary">{inq.status[0].toUpperCase() + inq.status.slice(1)}</span></td>
                </tr>
              ))}
              {stats.recentInquiries.length === 0 && (
                <tr><td colSpan={4} className="text-center text-muted py-4">No inquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
