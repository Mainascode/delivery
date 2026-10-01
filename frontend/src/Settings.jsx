import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    try {
      setError("");
      setLoggingOut(true);

      await logout();

      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);

      setError(err.message || "Unable to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const name = profile?.name || user?.displayName || "Not set";
  const email = user?.email || "Not set";
  const phone = profile?.phone || "Not set";

  return (
    <div className="page settings-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="eyebrow">ACCOUNT</div>

          <h1>Settings</h1>

          <p className="page-description">
            Manage your NITUME account and sign-in details.
          </p>
        </div>
      </div>

      {/* ACCOUNT DETAILS */}
      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <div className="eyebrow">YOUR DETAILS</div>

              <h2>Account information</h2>
            </div>

            <div className="settings-avatar">
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="settings-details">
            <div className="detail-row">
              <span>NAME</span>
              <strong>{name}</strong>
            </div>

            <div className="detail-row">
              <span>EMAIL</span>
              <strong>{email}</strong>
            </div>

            <div className="detail-row">
              <span>PHONE</span>
              <strong>{phone}</strong>
            </div>
          </div>
        </section>

        {/* ACCOUNT ACTIONS */}
        <section className="settings-card settings-danger">
          <div className="settings-card-header">
            <div>
              <div className="eyebrow">ACCOUNT ACTIONS</div>

              <h2>Sign out</h2>

              <p>
                Sign out of this NITUME account on this device.
              </p>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </section>

        {/* APP INFORMATION */}
        <section className="settings-card">
          <div className="eyebrow">NITUME</div>

          <h2>Shopping & delivery help</h2>

          <p>
            NITUME helps with shopping, errands and local deliveries
            around Ruaka and Gathigi Estate.
          </p>

          <button
            type="button"
            className="text-link settings-link-button"
            onClick={() => navigate("/help")}
          >
            Help & coverage →
          </button>
        </section>
      </div>
    </div>
  );
}
