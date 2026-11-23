import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import FormattedText from '../components/FormattedText';
import Price from '../components/Price';
import { TransportBadges } from './TourPackages';
import { useLanguage } from '../context/LanguageContext';
import { tourImageUrl } from '../utils/imageUrl';

/** "2" for a single value, "1–3" for a range. */
export function peopleLabel(hotel) {
  return hotel.people_per_room_min === hotel.people_per_room_max
    ? String(hotel.people_per_room_min)
    : `${hotel.people_per_room_min}–${hotel.people_per_room_max}`;
}

export default function TourPackageDetail() {
  const { slug } = useParams();
  const { t, localized, countryLabel } = useLanguage();
  const [pkg, setPkg] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setPkg(null);
    setNotFound(false);
    api
      .get(`/tour-packages/${slug}`)
      .then(({ data }) => setPkg(data.package))
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="container py-5 text-center">
        <h1>{t('tour.notFound')}</h1>
        <Link to="/tour-packages" className="btn btn-primary mt-3">{t('tour.back')}</Link>
      </div>
    );
  }
  if (!pkg) return <div className="container py-5 text-center text-muted">{t('common.loading')}</div>;

  const title = localized(pkg, 'title');
  const hasPrice = pkg.price !== null && pkg.price !== undefined;

  return (
    <section className="py-5">
      <div className="container">
        <div className="row g-5">
          <div className="col-lg-7">
            <div className="mb-2">
              {pkg.country && <span className="badge badge-country me-1">{countryLabel(pkg.country)}</span>}
              {pkg.duration_days ? <span className="badge text-bg-light border">{t('tour.duration', { n: pkg.duration_days })}</span> : null}
            </div>
            <h1 className="fw-bold">{title}</h1>
            {localized(pkg, 'destination') && <p className="lead text-muted"><i className="bi bi-geo-alt"></i> {localized(pkg, 'destination')}</p>}
            <img src={tourImageUrl(pkg)} className="img-fluid rounded mb-4" alt={title} />
            <FormattedText text={localized(pkg, 'description')} />

            {/* The hotel section only appears when the package has hotels */}
            {pkg.hotels.length > 0 && (
              <>
                <h4 className="fw-bold mt-4">{t('tour.hotels')}</h4>
                <ul className="list-group mb-3">
                  {pkg.hotels.map((hotel) => (
                    <li className="list-group-item" key={hotel.id}>
                      <div className="fw-semibold">
                        {hotel.name}
                        {hotel.stars ? <span className="text-warning ms-2" aria-label={`${hotel.stars} stars`}>{'★'.repeat(hotel.stars)}</span> : null}
                      </div>
                      {hotel.city && <div className="small text-muted"><i className="bi bi-geo-alt"></i> {hotel.city}</div>}
                      <div className="small"><i className="bi bi-people"></i> {t('tour.peoplePerRoom', { n: peopleLabel(hotel) })}</div>
                      {hotel.notes && <div className="small text-muted">{hotel.notes}</div>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="col-lg-5">
            <div className="card p-4 shadow-sm">
              {hasPrice && (
                <p className="mb-3">
                  <span className="text-muted small d-block">{t('tour.price')}</span>
                  <span className="fs-4 fw-bold"><Price amount={pkg.price} currency={pkg.price_currency} showOriginal /></span>
                  {localized(pkg, 'price_note') && <small className="text-muted d-block">{localized(pkg, 'price_note')}</small>}
                </p>
              )}
              {pkg.transport && (
                <p className="mb-3">
                  <span className="text-muted small d-block">{t('tour.transport')}</span>
                  <TransportBadges transport={pkg.transport} />
                </p>
              )}
              <p className="text-muted small">{t('tour.askText')}</p>
              <Link to={`/contact?tour=${encodeURIComponent(pkg.title)}`} className="btn btn-primary w-100">{t('tour.ask')}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
