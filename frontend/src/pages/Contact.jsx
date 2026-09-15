import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Contact() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedSlug = searchParams.get('service') || '';

  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '', service_id: '' });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/services').then(({ data }) => {
      setServices(data.services);
      if (preselectedSlug) {
        const match = data.services.find((s) => s.slug === preselectedSlug);
        if (match) setForm((f) => ({ ...f, service_id: match.id }));
      }
    });
  }, [preselectedSlug]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, full_name: user.full_name, email: user.email, phone: user.phone || '' }));
    }
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/inquiries', form);
      setSuccess(data.message);
      setForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      setErrors(err.response?.data?.errors || ['Something went wrong. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-6">
            <h1 className="fw-bold">Get In Touch</h1>
            <p className="text-muted">Have a question about studying abroad? Fill out the form and we'll get back to you.</p>
            <ul className="list-unstyled text-muted">
              <li className="mb-2"><i className="bi bi-geo-alt"></i> Faisalabad, Pakistan</li>
              <li className="mb-2"><i className="bi bi-envelope"></i> info@lnpak.com</li>
              <li><i className="bi bi-telephone"></i> +92 300 0000000</li>
            </ul>
          </div>
          <div className="col-lg-6">
            {success && <div className="alert alert-success">{success}</div>}
            {errors.length > 0 && (
              <div className="alert alert-danger">
                <ul className="mb-0">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input type="text" name="full_name" className="form-control" value={form.full_name} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input type="text" name="phone" className="form-control" value={form.phone} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label className="form-label">Which program are you interested in?</label>
                <select name="service_id" className="form-select" value={form.service_id} onChange={handleChange}>
                  <option value="">General Inquiry</option>
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Message</label>
                <textarea name="message" rows="4" className="form-control" value={form.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
