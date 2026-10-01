import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export default function Home() {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    api("/api/pricing/current")
      .then((data) => {
        if (mounted) setPricing(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">RUAKA · GATHIGI ESTATE</div>

          <h1>
            Need a hand?
            <br />
            Just request it.
          </h1>

          <p>
            Shopping, errands and deliveries around your area. Tell us what
            you need and we'll handle the running.
          </p>

          <div className="hero-actions">
            <Link to="/request" className="btn btn-primary">
              Request a rider
            </Link>

            <Link to="/orders" className="btn btn-secondary">
              View my orders
            </Link>
          </div>
        </div>

        {/* DELIVERY FEE */}
        <div className="hero-card">
          {loading ? (
            <div className="loading-inline">
              <span className="spinner" />
              <span>Checking delivery fee...</span>
            </div>
          ) : error ? (
            <>
              <div className="price-label">DELIVERY FEE</div>
              <div className="muted">{error}</div>
            </>
          ) : pricing ? (
            <>
              <div className="price-label">CURRENT DELIVERY FEE</div>

              <div className="price">
                KES {pricing.fee}
              </div>

              <div className="hero-card-row">
                <span>{pricing.mode}</span>
                {pricing.rule && <span>·</span>}
                {pricing.rule && <span>{pricing.rule}</span>}
              </div>

              <div className="availability">
                <span
                  className={`status-dot ${
                    pricing.available ? "status-open" : "status-closed"
                  }`}
                />

                <span>
                  {pricing.available
                    ? "Accepting requests"
                    : "Currently closed"}
                </span>
              </div>
            </>
          ) : (
            <div className="muted">Delivery pricing unavailable.</div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="section-heading">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>Simple from request to delivery.</h2>
        </div>

        <div className="section-grid">
          <div className="info-card">
            <div className="card-number">01</div>

            <h3>Tell us what you need</h3>

            <p>
              Add the items you want us to shop for and tell us where they
              should be collected.
            </p>
          </div>

          <div className="info-card">
            <div className="card-number">02</div>

            <h3>We do the running</h3>

            <p>
              Your request goes directly to our rider, who handles the
              shopping and delivery.
            </p>
          </div>

          <div className="info-card">
            <div className="card-number">03</div>

            <h3>Simple delivery</h3>

            <p>
              Keep track of your request and delivery records directly inside
              the app.
            </p>
          </div>
        </div>
      </section>

      {/* LOCAL SERVICE */}
      <section className="local-service">
        <div>
          <div className="eyebrow">LOCAL SERVICE</div>

          <h2>Built around your neighbourhood.</h2>

          <p>
            Serving Ruaka and Gathigi Estate with simple shopping, errands and
            delivery help.
          </p>
        </div>

        <Link to="/help" className="text-link">
          Help & coverage →
        </Link>
      </section>
    </div>
  );
}