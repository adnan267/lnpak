export default function Footer() {
  return (
    <footer className="site-footer mt-5 pt-5 pb-4">
      <div className="container">
        <div className="row gy-4">
          <div className="col-md-4">
            <h5 className="fw-bold text-white">LN PAK</h5>
            <p className="text-white-50">
              Your Gateway to Studying Abroad. We help students reach the UK, Canada, Australia and the USA
              with honest, end-to-end guidance.
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="text-white fw-semibold">Quick Links</h6>
            <ul className="list-unstyled">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About Us</a></li>
              <li><a href="/services">Services</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="text-white fw-semibold">Contact</h6>
            <ul className="list-unstyled text-white-50">
              <li><i className="bi bi-geo-alt"></i> Faisalabad, Pakistan</li>
              <li><i className="bi bi-envelope"></i> info@lnpak.com</li>
              <li><i className="bi bi-telephone"></i> +92 300 0000000</li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary" />
        <p className="text-center text-white-50 mb-0 small">&copy; {new Date().getFullYear()} LN PAK. All rights reserved.</p>
      </div>
    </footer>
  );
}
