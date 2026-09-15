import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { serviceImageUrl } from '../utils/imageUrl';

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setService(null);
    setNotFound(false);
    api
      .get(`/services/${slug}`)
      .then(({ data }) => setService(data.service))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h1>Service not found</h1>
        <Link to="/services" className="btn btn-primary mt-3">Back to Services</Link>
      </div>
    );
  }

  if (!service) {
    return <div className="container py-5 text-center text-muted">Loading...</div>;
  }

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            {service.country && <span className="badge badge-country mb-2">{service.country}</span>}
            <h1 className="fw-bold">{service.title}</h1>
            <p className="lead text-muted">{service.short_description}</p>
            <img src={serviceImageUrl(service)} className="img-fluid rounded mb-4" alt={service.title} />
            <div style={{ whiteSpace: 'pre-line' }}>{service.description}</div>
          </div>
          <div className="col-lg-5">
            <div className="card p-4 shadow-sm">
              <h5 className="fw-bold mb-3">Interested in this program?</h5>
              <p className="text-muted small">Send us your details and one of our counselors will reach out.</p>
              <Link to={`/contact?service=${service.slug}`} className="btn btn-primary w-100">
                Ask About This Program
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
