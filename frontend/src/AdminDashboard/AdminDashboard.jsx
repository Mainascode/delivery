import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await api("/api/admin/dashboard");
      setDashboard(data);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      setError(err.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const incomingCount = dashboard?.incomingCount ?? 0;
  const activeCount = dashboard?.activeCount ?? 0;
  const fee = dashboard?.pricing?.fee;
  const mode = dashboard?.pricing?.mode || "NORMAL";

  return (
    <div className="page operator-dashboard-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">NITUME / OPERATOR</span>
          <h1>Overview</h1>
          <p>
            Monitor customer requests, active deliveries and current
            delivery pricing.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>
          <button type="button" onClick={() => loadDashboard()}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <section className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-icon incoming">↗</div>

              <div>
                <span>INCOMING REQUESTS</span>
                <strong>{incomingCount}</strong>
              </div>

              <p>Customer requests waiting for action.</p>

              <Link to="/operator/orders">
                Review incoming orders →
              </Link>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon active">●</div>

              <div>
                <span>ACTIVE DELIVERIES</span>
                <strong>{activeCount}</strong>
              </div>

              <p>Orders currently being handled.</p>

              <Link to="/operator/orders">
                View active orders →
              </Link>
            </article>

            <article className="admin-stat-card">
              <div className="admin-stat-icon pricing">KES</div>

              <div>
                <span>CURRENT DELIVERY FEE</span>
                <strong>
                  {fee != null ? `KES ${fee}` : "--"}
                </strong>
              </div>

              <p>
                {mode === "RAIN"
                  ? "Rain pricing is active."
                  : "Normal pricing is active."}
              </p>

              <Link to="/operator/pricing">
                Manage pricing →
              </Link>
            </article>
          </section>

          <section className="admin-content-grid">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="eyebrow">QUICK ACTIONS</span>
                  <h2>Manage NITUME</h2>
                </div>
              </div>

              <div className="admin-action-list">
                <Link to="/operator/orders" className="admin-action">
                  <span className="admin-action-icon">📦</span>

                  <span>
                    <strong>Orders</strong>
                    <small>Review and update customer requests</small>
                  </span>

                  <b>→</b>
                </Link>

                <Link to="/operator/pricing" className="admin-action">
                  <span className="admin-action-icon">💰</span>

                  <span>
                    <strong>Pricing</strong>
                    <small>Manage normal and rain delivery fees</small>
                  </span>

                  <b>→</b>
                </Link>

                <Link to="/operator/settings" className="admin-action">
                  <span className="admin-action-icon">⚙</span>

                  <span>
                    <strong>Settings</strong>
                    <small>Control requests and operating mode</small>
                  </span>

                  <b>→</b>
                </Link>
              </div>
            </article>

            <article className="admin-panel admin-pricing-preview">
              <div className="admin-panel-heading">
                <div>
                  <span className="eyebrow">CURRENT PRICING</span>
                  <h2>Delivery fee</h2>
                </div>

                <span
                  className={`admin-mode-badge ${
                    mode === "RAIN" ? "rain" : "normal"
                  }`}
                >
                  {mode}
                </span>
              </div>

              <div className="admin-big-price">
                <small>KES</small>
                <strong>{fee ?? "--"}</strong>
              </div>

              <p>
                This is the delivery fee currently returned by the
                pricing service.
              </p>

              <Link
                to="/operator/pricing"
                className="btn btn-primary admin-full-button"
              >
                Manage pricing
              </Link>
            </article>
          </section>

          <section className="admin-panel admin-summary-panel">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">TODAY</span>
                <h2>Operations summary</h2>
              </div>
            </div>

            <div className="admin-summary-grid">
              <div>
                <span>Incoming requests</span>
                <strong>{incomingCount}</strong>
              </div>

              <div>
                <span>Active deliveries</span>
                <strong>{activeCount}</strong>
              </div>

              <div>
                <span>Pricing mode</span>
                <strong>{mode}</strong>
              </div>

              <div>
                <span>Current fee</span>
                <strong>
                  {fee != null ? `KES ${fee}` : "--"}
                </strong>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
