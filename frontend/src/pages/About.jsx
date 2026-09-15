export default function About() {
  return (
    <section className="py-5">
      <div className="container">
        <h1 className="fw-bold mb-4">About LN PAK</h1>
        <div className="row g-4">
          <div className="col-lg-8">
            <p className="lead">
              LN PAK is a Faisalabad-based study-abroad consultancy helping Pakistani students plan, apply, and
              successfully move to universities in the UK, Canada, Australia and the USA.
            </p>
            <p>
              We believe in transparent guidance: no false promises, no hidden fees, and a clear step-by-step
              process from choosing a university to landing at your destination.
            </p>
            <h5 className="mt-4">What We Do</h5>
            <ul>
              <li>University and program shortlisting based on your academic profile and budget</li>
              <li>Application document preparation (SOP, LORs, CV)</li>
              <li>Visa filing guidance and financial documentation support</li>
              <li>Pre-departure briefings and settling-in support</li>
            </ul>
          </div>
          <div className="col-lg-4">
            <div className="card p-4 shadow-sm">
              <h5 className="fw-bold">Why Students Choose Us</h5>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> Honest, no-pressure advice</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> Wide university network</li>
                <li className="mb-2"><i className="bi bi-check-circle-fill text-success"></i> End-to-end visa support</li>
                <li><i className="bi bi-check-circle-fill text-success"></i> Local, in-person support in Faisalabad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
