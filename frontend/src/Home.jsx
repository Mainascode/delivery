
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://delivery-y1yc.onrender.com"
).replace(/\/+$/, "");

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Unable to load delivery pricing."
    );
  }

  return data;
}

function formatFee(fee) {
  const amount = Number(fee);

  if (!Number.isFinite(amount)) {
    return "Unavailable";
  }

  return `KES ${amount.toLocaleString("en-KE")}`;
}

export default function Home() {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPricing() {
      try {
        setLoading(true);
        setError("");

        const data = await api("/api/pricing/current");

        if (mounted) {
          setPricing(data);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.message ||
              "We couldn't load the current delivery fee."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPricing();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page home-page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            RUAKA · GATHIGI ESTATE
          </div>

          <h1>
            Need a hand?
            <br />
            Just request it.
          </h1>

          <p>
            Shopping, errands and deliveries around your
            neighbourhood. Tell us what you need, and
            we&apos;ll handle the running.
          </p>

          <div className="hero-actions">
            <Link to="/request" className="btn btn-primary">
              Request a delivery
            </Link>

            <Link to="/orders" className="btn btn-secondary">
              View my orders
            </Link>
          </div>

          <div className="home-trust-note">
            <span aria-hidden="true">✓</span>
            Local help, straightforward delivery.
          </div>
        </div>

        {/* DELIVERY FEE */}
        <div className="hero-card">
          {loading ? (
            <div
              className="loading-inline"
              role="status"
              aria-live="polite"
            >
              <span className="spinner" />
              <span>Checking delivery fee...</span>
            </div>
          ) : error ? (
            <div role="alert">
              <div className="price-label">
                DELIVERY FEE
              </div>

              <p className="muted">
                {error}
              </p>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : pricing ? (
            <>
              <div className="price-label">
                CURRENT DELIVERY FEE
              </div>

              <div className="price">
                {formatFee(pricing.fee)}
              </div>

              <div className="hero-card-row">
                {pricing.mode && (
                  <span>
                    {pricing.mode === "RAIN"
                      ? "Rain mode"
                      : pricing.mode === "NORMAL"
                        ? "Normal pricing"
                        : pricing.mode}
                  </span>
                )}

                {pricing.mode && pricing.rule && (
                  <span aria-hidden="true">·</span>
                )}

                {pricing.rule && (
                  <span>{pricing.rule}</span>
                )}
              </div>

              <div className="availability">
                <span
                  className={`status-dot ${
                    pricing.available
                      ? "status-open"
                      : "status-closed"
                  }`}
                />

                <span>
                  {pricing.available
                    ? "Accepting requests"
                    : "Currently closed"}
                </span>
              </div>
              {pricing.available && (
                <Link
                  to="/request"
                  className="btn btn-primary hero-card-cta"
                >
                  Start a request
                </Link>
              )}
            </>
          ) : (
            <div className="muted">
              Delivery pricing is currently unavailable.
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="section-heading">
          <div className="eyebrow">
            HOW IT WORKS
          </div>

          <h2>
            Simple from request to delivery.
          </h2>

          <p>
            No complicated process. Just tell us what
            you need and let us handle the running.
          </p>
        </div>

        <div className="section-grid">
          <article className="info-card">
            <div className="card-number">01</div>

            <h3>Tell us what you need</h3>

            <p>
              List the items you want us to shop for,
              add collection details and tell us where
              everything should be delivered.
            </p>
          </article>

          <article className="info-card">
            <div className="card-number">02</div>

            <h3>We do the running</h3>

            <p>
              Your request goes to our operator, who
              coordinates the shopping, collection
              and delivery.
            </p>
          </article>

          <article className="info-card">
            <div className="card-number">03</div>

            <h3>Follow your request</h3>

            <p>
              Check your orders and follow their status
              as your request moves through the delivery
              process.
            </p>
          </article>
        </div>
      </section>

      {/* LOCAL SERVICE */}
      <section className="local-service">
        <div>
          <div className="eyebrow">
            LOCAL SERVICE
          </div>
          

          <h2>
            Built around your neighbourhood.
          </h2>

          <p>
            Serving Ruaka and Gathigi Estate with
            shopping, errands, and everyday delivery
            assistance.
          </p>

          <div className="local-service-tags">
            <span>Shopping</span>
            <span>Errands</span>
            <span>Deliveries</span>
          </div>
        </div>

        <div className="local-service-action">
          <p>
            Need something picked up or delivered?
          </p>

          <Link
            to="/request"
            className="btn btn-primary"
          >
            Make a request
          </Link>
        </div>
      </section>

      {/* SERVICE REMINDER */}
      <section className="home-footer-note">
        <span aria-hidden="true">✳</span>

        <p>
          Your neighbourhood made a little easier.
          Delivery fees cover the delivery service;
          purchased items are charged separately.
        </p>
      </section>
    </div>
  );
}