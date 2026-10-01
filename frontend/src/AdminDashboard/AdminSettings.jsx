import React, { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function AdminSettingsScreen() {
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
        setError(
          err.message || "Unable to load settings."
        );
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

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError(
        err.message || "Unable to update settings."
      );
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
        <div className="page-header">
          <div>
            <div className="eyebrow">
              NITUME / OPERATOR
            </div>
            <h1>Settings</h1>
          </div>
        </div>

        <div className="loading-card">
          <div className="spinner" />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page admin-settings-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            NITUME / OPERATOR
          </div>

          <h1>Settings</h1>

          <p className="page-description">
            Control whether customers can place requests
            and which delivery pricing mode is active.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="admin-settings-list">
        <section className="admin-setting-card">
          <div className="admin-setting-content">
            <div className="admin-setting-icon">
              ✓
            </div>

            <div>
              <h2>Accept requests</h2>

              <p>
                Allow customers to submit new delivery
                requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${
              accepting ? "toggle-on" : ""
            }`}
            role="switch"
            aria-checked={accepting}
            disabled={saving === "accepting"}
            onClick={handleAcceptingChange}
          >
            <span className="toggle-knob" />
          </button>
        </section>

        <section className="admin-setting-card">
          <div className="admin-setting-content">
            <div className="admin-setting-icon">
              ☔
            </div>

            <div>
              <h2>Rain mode</h2>

              <p>
                Apply rainy-weather delivery pricing to
                customer requests.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`toggle ${
              rain ? "toggle-on" : ""
            }`}
            role="switch"
            aria-checked={rain}
            disabled={saving === "rain"}
            onClick={handleRainChange}
          >
            <span className="toggle-knob" />
          </button>
        </section>

        <section className="admin-settings-info">
          <div>
            <span className="eyebrow">
              CURRENT MODE
            </span>

            <strong>
              {rain ? "RAIN PRICING" : "NORMAL PRICING"}
            </strong>
          </div>

          <p>
            {accepting
              ? "Customers can currently submit new requests."
              : "New customer requests are currently disabled."}
          </p>
        </section>
      </div>
    </div>
  );
}