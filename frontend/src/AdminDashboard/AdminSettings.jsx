import React, { useEffect, useState } from "react";
import { api } from "../services/api";

const PRICING_RULES = [
{
time: "6:00 AM – 9:00 AM",
normal: 100,
rain: 120,
},
{
time: "9:00 AM – 5:00 PM",
normal: 50,
rain: 70,
},
{
time: "5:00 PM – 10:00 PM",
normal: 100,
rain: 120,
},
];

function formatMode(mode) {
if (mode === "RAIN") return "RAIN PRICING";
return "NORMAL PRICING";
}

export default function AdminSettings() {
const [accepting, setAccepting] = useState(true);
const [rain, setRain] = useState(false);
const [pricing, setPricing] = useState(null);

const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState("");
const [refreshing, setRefreshing] = useState(false);

const [error, setError] = useState("");
const [success, setSuccess] = useState("");

async function loadSettings(showLoader = false) {
try {
if (showLoader) {
setRefreshing(true);
}


  setError("");

  const data = await api("/api/admin/dashboard");

  setAccepting(
    data.settings?.acceptingRequests ?? true
  );

  setRain(
    data.settings?.weatherMode === "RAIN"
  );

  setPricing(data.pricing || null);
} catch (err) {
  console.error(
    "Failed to load admin settings:",
    err
  );

  setError(
    err.message || "Unable to load settings."
  );
} finally {
  if (showLoader) {
    setRefreshing(false);
  }
}
}

useEffect(() => {
async function initialLoad() {
setLoading(true);


  await loadSettings();

  setLoading(false);
}

initialLoad();


}, []);

async function save(changes, setting) {
try {
setSaving(setting);
setError("");
setSuccess("");


  const data = await api(
    "/api/admin/settings",
    {
      method: "PATCH",
      body: JSON.stringify(changes),
    }
  );

  setAccepting(
    data.settings?.acceptingRequests ?? true
  );

  setRain(
    data.settings?.weatherMode === "RAIN"
  );

  /*
   * Refresh pricing after changing the settings
   * so the displayed fee always comes from the
   * backend pricing calculation.
   */
  const dashboard = await api(
    "/api/admin/dashboard"
  );

  setPricing(
    dashboard.pricing || null
  );

  setSuccess(
    setting === "accepting"
      ? data.settings?.acceptingRequests
        ? "Customer requests are now open."
        : "Customer requests have been paused."
      : data.settings?.weatherMode === "RAIN"
        ? "Rain pricing is now active."
        : "Normal pricing is now active."
  );

  window.setTimeout(() => {
    setSuccess("");
  }, 3000);
} catch (err) {
  console.error(
    "Failed to update settings:",
    err
  );

  setError(
    err.message ||
      "Unable to update settings."
  );
} finally {
  setSaving("");
}



}

function handleAcceptingChange() {
if (saving) return;



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
if (saving) return;


const value = !rain;

setRain(value);

save(
  {
    weatherMode: value
      ? "RAIN"
      : "NORMAL",
  },
  "rain"
);


}

async function handleRefresh() {
setSuccess("");


await loadSettings(true);

setSuccess("Settings refreshed.");

window.setTimeout(() => {
  setSuccess("");
}, 2500);


}

if (loading) {
return ( <div className="page"> <div className="admin-page-heading"> <div> <span className="eyebrow">
NITUME / OPERATOR </span>


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

const currentMode =
pricing?.mode ||
(rain ? "RAIN" : "NORMAL");

const currentFee =
pricing?.fee != null
? pricing.fee
: null;

return ( <div className="page admin-settings-page">

  {/* HEADER */}
  <div className="admin-page-heading">
    <div>
      <span className="eyebrow">
        NITUME / OPERATOR
      </span>

      <h1>Settings</h1>

      <p>
        Manage customer requests, delivery
        pricing and service availability.
      </p>
    </div>

    <button
      type="button"
      className="btn btn-secondary"
      onClick={handleRefresh}
      disabled={refreshing || saving}
    >
      {refreshing
        ? "Refreshing..."
        : "↻ Refresh"}
    </button>
  </div>

  {/* ALERTS */}
  {error && (
    <div className="admin-alert admin-alert-error">
      <span>⚠</span>
      <span>{error}</span>
    </div>
  )}

  {success && (
    <div className="admin-alert admin-alert-success">
      <span>✓</span>
      <span>{success}</span>
    </div>
  )}

  <div className="admin-settings-list">

    {/* ACCEPT REQUESTS */}
    <section className="admin-setting-card">
      <div className="admin-setting-left">

        <div className="admin-setting-icon">
          ✓
        </div>

        <div>
          <span className="eyebrow">
            CUSTOMER ORDERS
          </span>

          <h2>Accept requests</h2>

          <p>
            Allow customers to submit new
            delivery and shopping requests.
          </p>

          <span
            className={`admin-setting-status ${
              accepting
                ? "status-success"
                : "status-danger"
            }`}
          >
            {accepting
              ? "Requests are open"
              : "Requests are paused"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`admin-toggle ${
          accepting ? "on" : ""
        }`}
        role="switch"
        aria-checked={accepting}
        aria-label="Accept customer requests"
        disabled={
          saving === "accepting"
        }
        onClick={
          handleAcceptingChange
        }
      >
        <span />
      </button>
    </section>

    {/* RAIN MODE */}
    <section className="admin-setting-card">
      <div className="admin-setting-left">

        <div className="admin-setting-icon">
          ☔
        </div>

        <div>
          <span className="eyebrow">
            DELIVERY PRICING
          </span>

          <h2>Rain mode</h2>

          <p>
            Use the rainy-weather delivery
            fee when this mode is active.
          </p>

          <span
            className={`admin-setting-status ${
              rain
                ? "status-active"
                : "status-success"
            }`}
          >
            {rain
              ? "Rain pricing active"
              : "Normal pricing active"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={`admin-toggle ${
          rain ? "on" : ""
        }`}
        role="switch"
        aria-checked={rain}
        aria-label="Enable rain pricing"
        disabled={
          saving === "rain"
        }
        onClick={
          handleRainChange
        }
      >
        <span />
      </button>
    </section>

    {/* SERVICE STATUS */}
    <section className="admin-settings-status">

      <div>
        <span className="eyebrow">
          SERVICE STATUS
        </span>

        <strong>
          {accepting
            ? "ACCEPTING CUSTOMER REQUESTS"
            : "REQUESTS PAUSED"}
        </strong>

        <span>
          {accepting
            ? "Customers can currently submit requests."
            : "New customer requests are temporarily disabled."}
        </span>
      </div>

      <div>
        <span className="eyebrow">
          PRICING MODE
        </span>

        <strong>
          {formatMode(currentMode)}
        </strong>

        <span>
          Current delivery fee:{" "}
          {currentFee != null
            ? `KES ${currentFee}`
            : "Unavailable"}
        </span>
      </div>

    </section>

    {/* PRICING */}
    <section className="admin-panel">

      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            DELIVERY PRICING
          </span>

          <h2>
            Current pricing
          </h2>

          <p>
            NITUME delivery fees are calculated
            automatically according to the
            current time and pricing mode.
          </p>
        </div>

        <div className="admin-pricing-current">
          <span className="eyebrow">
            CURRENT FEE
          </span>

          <strong>
            {currentFee != null
              ? `KES ${currentFee}`
              : "--"}
          </strong>
        </div>
      </div>

      <div className="pricing-mode-banner">

        <div>
          <span className="pricing-mode-icon">
            {currentMode === "RAIN"
              ? "☔"
              : "☀"}
          </span>

          <div>
            <strong>
              {currentMode === "RAIN"
                ? "Rain pricing is active"
                : "Normal pricing is active"}
            </strong>

            <span>
              {currentMode === "RAIN"
                ? "Customers are charged the rainy-weather delivery rates."
                : "Customers are charged the normal delivery rates."}
            </span>
          </div>
        </div>

        <span className="pricing-mode-badge">
          {currentMode === "RAIN"
            ? "RAIN"
            : "NORMAL"}
        </span>

      </div>

      {/* FEE TABLE */}
      <div className="pricing-table">

        <div className="pricing-row pricing-header">
          <span>TIME</span>
          <span>NORMAL</span>
          <span>RAIN</span>
        </div>

        {PRICING_RULES.map(
          (rule) => (
            <div
              className="pricing-row"
              key={rule.time}
            >
              <span>
                {rule.time}
              </span>

              <strong>
                KES{" "}
                {rule.normal.toLocaleString(
                  "en-KE"
                )}
              </strong>

              <strong>
                KES{" "}
                {rule.rain.toLocaleString(
                  "en-KE"
                )}
              </strong>
            </div>
          )
        )}

        <div className="pricing-row pricing-closed">
          <span>
            Outside service hours
          </span>

          <strong>
            Closed
          </strong>

          <strong>
            Closed
          </strong>
        </div>

      </div>

    </section>

    {/* SERVICE INFORMATION */}
    <section className="admin-panel">

      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            NITUME SERVICE
          </span>

          <h2>
            How pricing works
          </h2>
        </div>
      </div>

      <div className="admin-info-grid">

        <div className="admin-info-card">
          <span className="admin-info-icon">
            ☀
          </span>

          <div>
            <strong>
              Normal pricing
            </strong>

            <p>
              Standard delivery rates are
              applied when rain mode is off.
            </p>
          </div>
        </div>

        <div className="admin-info-card">
          <span className="admin-info-icon">
            ☔
          </span>

          <div>
            <strong>
              Rain pricing
            </strong>

            <p>
              Higher delivery rates are
              automatically used when rain
              mode is active.
            </p>
          </div>
        </div>

        <div className="admin-info-card">
          <span className="admin-info-icon">
            🕐
          </span>

          <div>
            <strong>
              Service hours
            </strong>

            <p>
              Requests are available from
              6:00 AM to 10:00 PM.
            </p>
          </div>
        </div>

      </div>

    </section>

  </div>
</div>


);
}
