import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AdminPricing() {
  const [pricing, setPricing] = useState(null);
  const [weatherMode, setWeatherMode] = useState("NORMAL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api("/api/admin/dashboard");

        setPricing(data.pricing || null);
        setWeatherMode(
          data.settings?.weatherMode || "NORMAL"
        );
      } catch (err) {
        setError(err.message || "Unable to load pricing.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function changeMode(mode) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const data = await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          weatherMode: mode,
        }),
      });

      setWeatherMode(
        data.settings?.weatherMode || mode
      );

      const dashboard = await api("/api/admin/dashboard");

      setPricing(dashboard.pricing || null);
      setMessage("Pricing mode updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update pricing.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-pricing-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">NITUME / OPERATOR</span>
          <h1>Pricing</h1>
          <p>
            View the current delivery fee and switch between normal
            and rainy-weather pricing.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      {message && (
        <div className="admin-alert admin-alert-success">
          {message}
        </div>
      )}

      <section className="pricing-hero-card">
        <div>
          <span className="eyebrow">CURRENT DELIVERY FEE</span>

          <div className="pricing-hero-price">
            <small>KES</small>
            <strong>{pricing?.fee ?? "--"}</strong>
          </div>

          <p>
            Current pricing mode:{" "}
            <strong>{pricing?.mode || weatherMode}</strong>
          </p>
        </div>

        <div className="pricing-mode-selector">
          <span className="eyebrow">PRICING MODE</span>

          <div className="pricing-mode-buttons">
            <button
              type="button"
              className={
                weatherMode === "NORMAL" ? "selected" : ""
              }
              disabled={saving}
              onClick={() => changeMode("NORMAL")}
            >
              ☀ Normal
            </button>

            <button
              type="button"
              className={
                weatherMode === "RAIN" ? "selected" : ""
              }
              disabled={saving}
              onClick={() => changeMode("RAIN")}
            >
              ☔ Rain
            </button>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">FEE SCHEDULE</span>
            <h2>Delivery pricing rules</h2>
          </div>
        </div>

        <div className="pricing-table">
          <div className="pricing-row pricing-header">
            <span>TIME</span>
            <span>NORMAL</span>
            <span>RAIN</span>
          </div>

          <div className="pricing-row">
            <span>6:00 AM – 9:00 AM</span>
            <strong>KES 100</strong>
            <strong>KES 120</strong>
          </div>

          <div className="pricing-row">
            <span>9:00 AM – 5:00 PM</span>
            <strong>KES 50</strong>
            <strong>KES 70</strong>
          </div>

          <div className="pricing-row">
            <span>5:00 PM – 10:00 PM</span>
            <strong>KES 100</strong>
            <strong>KES 120</strong>
          </div>

          <div className="pricing-row">
            <span>Outside service hours</span>
            <strong>Closed</strong>
            <strong>Closed</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

