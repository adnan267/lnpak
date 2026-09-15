import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const badgeClass = { new: 'bg-primary', contacted: 'bg-warning', closed: 'bg-secondary' };

export default function Dashboard() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inquiries/mine').then(({ data }) => {
      setInquiries(data.inquiries);
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-1">Welcome, {user?.full_name}</h1>
        <p className="text-muted mb-4">Here's a history of the inquiries you've sent us.</p>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Date</th><th>Program</th><th>Message</th><th>Status</th></tr>
              </thead>
              <tbody>
                {inquiries.map((inq) => (
                  <tr key={inq.id}>
                    <td className="text-nowrap">{new Date(inq.created_at).toLocaleDateString()}</td>
                    <td>{inq.service_title || 'General Inquiry'}</td>
                    <td className="small">{inq.message?.length > 80 ? inq.message.slice(0, 80) + '...' : inq.message}</td>
                    <td><span className={`badge ${badgeClass[inq.status] || 'bg-secondary'}`}>{inq.status[0].toUpperCase() + inq.status.slice(1)}</span></td>
                  </tr>
                ))}
                {!loading && inquiries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      You haven't sent any inquiries yet. <Link to="/contact">Contact us</Link> to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
