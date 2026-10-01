import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
    throw new Error(data.error || data.message || "Something went wrong.");
  }

  return data;
}

export default function Register({ onLogin }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function register(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          password,
          confirmPassword,
        }),
      });

      /*
       * If the backend logs the customer in immediately,
       * use the returned role and go straight to the app.
       */
      if (result.authenticated && result.user) {
        if (onLogin) {
          onLogin(result.user.role);
        } else {
          navigate("/");
        }

        return;
      }

      /*
       * If registration succeeds but the backend does not
       * automatically authenticate, send the customer to login.
       */
      setMessage(
        result.message ||
          "Account created successfully. You can now sign in."
      );

      setName("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* BRAND */}
        <div className="auth-brand">
          <div className="brand-mark">N</div>

          <div>
            <div className="brand-name">NITUME</div>

            <div className="brand-location">
              RUAKA · GATHIGI ESTATE
            </div>
          </div>
        </div>

        {/* HEADING */}
        <div className="auth-heading">
          <div className="eyebrow">GET STARTED</div>

          <h1>Need a hand?</h1>

          <p className="auth-subtitle">
            Create your NITUME account and start requesting shopping,
            errands and deliveries around your area.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {/* FORM */}
        <form className="auth-form" onSubmit={register}>
          <label className="field">
            <span>Full name</span>

            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Phone number</span>

            <input
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>

            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Confirm password</span>

            <input
              type="password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* LOGIN */}
        <div className="auth-note">
          Already have an account?{" "}
          <Link to="/login" className="text-link">
            Sign in
          </Link>
        </div>

        <div className="auth-note">
          By creating an account, you can request shopping, errands
          and local delivery help through NITUME.
        </div>
      </div>
    </div>
  );
}

