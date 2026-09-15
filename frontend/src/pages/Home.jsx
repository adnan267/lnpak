import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { serviceImageUrl } from '../utils/imageUrl';

export default function Home() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data.services.slice(0, 4)));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container text-center">
          <h1 className="display-5 mb-3">Your Gateway to Studying Abroad</h1>
          <p className="lead mb-4">
            Honest guidance for Pakistani students applying to universities in the UK, Canada, Australia and the USA.
          </p>
          <Link to="/contact" className="btn btn-primary btn-lg px-4">Get Free Consultation</Link>
          <Link to="/services" className="btn btn-outline-light btn-lg px-4 ms-2">Explore Programs</Link>
        </div>
      </section>

      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Our Study Destinations</h2>
            <p className="text-muted">A few of the programs we currently help students with</p>
          </div>
          <div className="row g-4">
            {services.map((service) => (
              <div className="col-md-6 col-lg-3" key={service.id}>
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
            {services.length === 0 && (
              <p className="text-muted text-center">Services will appear here once added from the admin panel.</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-md-4">
              <i className="bi bi-mortarboard display-5 text-primary"></i>
              <h5 className="mt-3">University Selection</h5>
              <p className="text-muted small">We match your profile and budget to the right universities and programs.</p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-file-earmark-text display-5 text-primary"></i>
              <h5 className="mt-3">Application & Visa Support</h5>
              <p className="text-muted small">From SOPs to visa documentation, we prepare every piece with you.</p>
            </div>
            <div className="col-md-4">
              <i className="bi bi-headset display-5 text-primary"></i>
              <h5 className="mt-3">Ongoing Support</h5>
              <p className="text-muted small">Pre-departure briefings and support even after you land abroad.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
