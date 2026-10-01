import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

export default function AdminDashboardScreen() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
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
    load();
  }, [load]);

  const incomingCount = dashboard?.incomingCount ?? 0;
  const activeCount = dashboard?.activeCount ?? 0;
  const fee = dashboard?.pricing?.fee;
  const mode = dashboard?.pricing?.mode;

  return (
    <div className="page operator-dashboard-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">NITUME / OPERATOR</div>
          <h1>Overview</h1>
          <p className="page-description">
            Keep an eye on incoming requests, active deliveries and today's
            delivery pricing.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>

          <button
            type="button"
            className="alert-action"
            onClick={() => load()}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <section className="operator-stats">
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">INCOMING</span>
                <span className="stat-icon">↗</span>
              </div>

              <strong>{incomingCount}</strong>

              <p>Requests waiting for action</p>

              <Link to="/operator/orders" className="stat-link">
                View incoming orders →
              </Link>
            </div>

            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-label">ACTIVE</span>
                <span className="stat-icon">●</span>
              </div>

              <strong>{activeCount}</strong>

              <p>Deliveries currently in progress</p>

              <Link to="/operator/orders" className="stat-link">
                View active orders →
              </Link>
            </div>
          </section>

          <section className="operator-grid">
            <div className="operator-card operator-pricing-card">
              <div className="operator-card-header">
                <div>
                  <span className="eyebrow">CURRENT PRICING</span>
                  <h2>Delivery fee</h2>
                </div>

                <Link to="/operator/pricing" className="card-link">
                  Manage
                </Link>
              </div>

              <div className="operator-price">
                <span>KES</span>
                <strong>{fee ?? "--"}</strong>
              </div>

              <div className="pricing-mode">
                <span className="status-dot" />
                <span>{mode || "Pricing mode unavailable"}</span>
              </div>
            </div>

            <div className="operator-card">
              <div className="operator-card-header">
                <div>
                  <span className="eyebrow">QUICK ACTIONS</span>
                  <h2>Manage NITUME</h2>
                </div>
              </div>

              <div className="operator-actions">
                <Link to="/operator/orders" className="operator-action">
                  <span>
                    <strong>Orders</strong>
                    <small>Review customer requests</small>
                  </span>
                  <span>→</span>
                </Link>

                <Link to="/operator/pricing" className="operator-action">
                  <span>
                    <strong>Pricing</strong>
                    <small>Update delivery fees</small>
                  </span>
                  <span>→</span>
                </Link>

                <Link to="/operator/settings" className="operator-action">
                  <span>
                    <strong>Settings</strong>
                    <small>Manage operator settings</small>
                  </span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </section>

          <section className="operator-card operator-summary-card">
            <div className="operator-card-header">
              <div>
                <span className="eyebrow">TODAY</span>
                <h2>Operations summary</h2>
              </div>
            </div>

            <div className="summary-grid">
              <div>
                <span className="summary-label">Incoming requests</span>
                <strong>{incomingCount}</strong>
              </div>

              <div>
                <span className="summary-label">Active deliveries</span>
                <strong>{activeCount}</strong>
              </div>

              <div>
                <span className="summary-label">Current fee</span>
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