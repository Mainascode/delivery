import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "./services/firebase";

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
    throw new Error(
      data.error || data.message || "Something went wrong."
    );
  }

  return data;
}

export default function Request() {
  const navigate = useNavigate();

  const [items, setItems] = useState("");
  const [pickup, setPickup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!items.trim()) {
      setError("Please tell us what you would like us to shop for.");
      return;
    }

    if (!delivery.trim()) {
      setError("Please enter your delivery location.");
      return;
    }

    /*
     * Customers can browse without an account,
     * but an account is required before sending
     * the first request.
     */
    if (!auth.currentUser) {
      navigate("/login", {
        state: {
          from: "/request",
          orderDraft: {
            items: items.trim(),
            pickupLocation: pickup.trim(),
            deliveryLocation: delivery.trim(),
            notes: notes.trim(),
          },
        },
      });

      return;
    }

    try {
      setLoading(true);

      await api("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.trim(),
          pickupLocation: pickup.trim(),
          deliveryLocation: delivery.trim(),
          notes: notes.trim(),
        }),
      });

      setSuccess(true);

      setItems("");
      setPickup("");
      setDelivery("");
      setNotes("");
    } catch (err) {
      console.error("Request failed:", err);

      setError(
        err.message || "Unable to send your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="success-card">
          <div className="success-icon">✓</div>

          <div className="eyebrow">REQUEST SENT</div>

          <h1>Your request is on its way.</h1>

          <p>
            Your shopping request has been sent to the rider. You can
            follow its status from your orders.
          </p>

          <div className="hero-actions">
            <Link to="/orders" className="btn btn-primary">
              View my orders
            </Link>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSuccess(false)}
            >
              Make another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page request-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">REQUEST A RIDER</div>

          <h1>What do you need?</h1>

          <p className="page-description">
            Tell us what you need, where to collect it and where
            it should be delivered.
          </p>
        </div>
      </div>

      <div className="request-layout">
        {/* FORM */}
        <form className="request-card" onSubmit={submit}>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* SHOPPING LIST */}
          <label className="field">
            <span>SHOPPING LIST</span>

            <textarea
              placeholder={`Example:
2kg rice
Milk
Bread
Cooking oil`}
              value={items}
              onChange={(event) => setItems(event.target.value)}
              rows={6}
              disabled={loading}
            />
          </label>

          {/* PICKUP */}
          <label className="field">
            <span>PICKUP / SHOP</span>

            <input
              type="text"
              placeholder="Shop or supermarket"
              value={pickup}
              onChange={(event) => setPickup(event.target.value)}
              disabled={loading}
            />
          </label>

          {/* DELIVERY */}
          <label className="field">
            <span>DELIVERY LOCATION</span>

            <input
              type="text"
              placeholder="Where should we deliver?"
              value={delivery}
              onChange={(event) => setDelivery(event.target.value)}
              disabled={loading}
            />
          </label>

          {/* NOTES */}
          <label className="field">
            <span>NOTES</span>

            <textarea
              placeholder="Anything else we should know?"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              disabled={loading}
            />
          </label>

          {/* ACTIONS */}
          <div className="request-actions">
            <Link to="/" className="btn btn-secondary">
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>

        {/* REQUEST SUMMARY */}
        <aside className="request-summary">
          <div className="eyebrow">BEFORE YOU SEND</div>

          <h2>How it works</h2>

          <div className="summary-item">
            <div className="summary-number">01</div>

            <div>
              <strong>Tell us what to shop for</strong>

              <p>
                List the items you need as clearly as possible.
              </p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-number">02</div>

            <div>
              <strong>We confirm the request</strong>

              <p>
                The rider receives your request and can review the
                shopping details.
              </p>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-number">03</div>

            <div>
              <strong>We handle the running</strong>

              <p>
                Your order is collected and delivered to the location
                you provide.
              </p>
            </div>
          </div>

          <div className="summary-note">
            <strong>Need an account?</strong>

            <p>
              You can browse NITUME without signing in. An account is
              only required when you send your first request.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}