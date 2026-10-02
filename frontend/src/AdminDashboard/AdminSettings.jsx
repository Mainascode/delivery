import React, { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AdminSettings() {
  const [accepting, setAccepting] = useState(true);
  const [rain, setRain] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const data = await api("/api/admin/dashboard");

        setAccepting(
          data.settings?.acceptingRequests ?? true
        );

        setRain(
          data.settings?.weatherMode === "RAIN"
        );
      } catch (err) {
        console.error("Failed to load admin settings:", err);
        setError(err.message || "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function save(changes, setting) {
    try {
      setSaving(setting);
      setError("");
      setSuccess("");

      const data = await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(changes),
      });

      setAccepting(
        data.settings?.acceptingRequests ?? true
      );

      setRain(
        data.settings?.weatherMode === "RAIN"
      );

      setSuccess("Settings updated successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError(err.message || "Unable to update settings.");
    } finally {
      setSaving("");
    }
  }

  function handleAcceptingChange() {
    const value = !accepting;

    setAccepting(value);

    save(
      {
        acceptingRequests: value,
      },
      "accepting"
    );
  }

  function handleRainChange() {
    const value = !rain;

    setRain(value);

    save(
      {
        weatherMode: value ? "RAIN" : "NORMAL",
      },
      "rain"
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="admin-page-heading">
          <div>
            <span className="eyebrow">NITUME / OPERATOR</span>
            <h1>Settings</h1>
          </div>
        </div>

        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-settings-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">NITUME / OPERATOR</span>
          <h1>Settings</h1>
          <p>
            Control customer requests and the weather pricing mode.
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          {success}
        </div>
      )}

      <div className="admin-settings-list">
        <section className="admin-setting-card">
          <div className="admin-setting-left">
            <div className="admin-setting-icon">✓</div>

            <div>
              <span className="eyebrow">CUSTOMER ORDERS</span>
              <h2>Accept requests</h2>
              <p>
                Allow customers to submit new delivery and shopping
                requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`admin-toggle ${
              accepting ? "on" : ""
            }`}
            role="switch"
            aria-checked={accepting}
            disabled={saving === "accepting"}
            onClick={handleAcceptingChange}
          >
            <span />
          </button>
        </section>

        <section className="admin-setting-card">
          <div className="admin-setting-left">
            <div className="admin-setting-icon">☔</div>

            <div>
              <span className="eyebrow">DELIVERY PRICING</span>
              <h2>Rain mode</h2>
              <p>
                Use the rainy-weather delivery fee when this mode is
                active.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`admin-toggle ${rain ? "on" : ""}`}
            role="switch"
            aria-checked={rain}
            disabled={saving === "rain"}
            onClick={handleRainChange}
          >
            <span />
          </button>
        </section>

        <section className="admin-settings-status">
          <div>
            <span className="eyebrow">SERVICE STATUS</span>
            <strong>
              {accepting
                ? "ACCEPTING CUSTOMER REQUESTS"
                : "REQUESTS PAUSED"}
            </strong>
          </div>

          <div>
            <span className="eyebrow">PRICING MODE</span>
            <strong>
              {rain ? "RAIN PRICING" : "NORMAL PRICING"}
            </strong>
          </div>
        </section>
      </div>
    </div>
  );
}

