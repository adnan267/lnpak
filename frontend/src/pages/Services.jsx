import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { serviceImageUrl } from '../utils/imageUrl';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services').then(({ data }) => {
      setServices(data.services);
      setLoading(false);
    });
  }, []);

  return (
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-2">Our Services</h1>
        <p className="text-muted mb-4">Study destinations and support programs we currently offer.</p>

        <div className="row g-4">
          {services.map((service) => (
            <div className="col-md-6 col-lg-4" key={service.id}>
              <div className="card service-card">
                <img src={serviceImageUrl(service)} className="card-img-top" alt={service.title} />
                <div className="card-body">
                  {service.country && <span className="badge badge-country mb-2">{service.country}</span>}
                  <h5 className="card-title">{service.title}</h5>
                  <p className="card-text small text-muted">{service.short_description}</p>
                  <Link to={`/services/${service.slug}`} className="btn btn-sm btn-outline-primary">Learn More</Link>
                </div>
              </div>
            </div>
          ))}
          {!loading && services.length === 0 && <p className="text-muted">No services published yet.</p>}
        </div>
      </div>
    </section>
  );
}
