import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

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

export default function Register({ onLogin }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      /*
       * Create the Firebase account.
       */
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      /*
       * Store the user's name in Firebase.
       */
      await updateProfile(credential.user, {
        displayName: name.trim(),
      });

      /*
       * Store the application profile in MongoDB/backend.
       */
      await api("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      setSuccess("Account created successfully.");

      /*
       * Firebase is already authenticated at this point.
       * Give AuthContext a moment to detect the new user,
       * then return to the customer home page.
       */
      if (onLogin) {
        onLogin("CUSTOMER");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Registration error:", err);

      let message = "Unable to create your account.";

      if (err.code === "auth/email-already-in-use") {
        message = "An account with this email already exists.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        message = "Please choose a stronger password.";
      } else if (err.code === "auth/configuration-not-found") {
        message =
          "Firebase Authentication is not configured correctly.";
      } else if (err.code === "auth/network-request-failed") {
        message =
          "Network error. Check your internet connection and try again.";
      } else if (err.message) {
        message = err.message;
      }

      setError(message);
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

          <h1>Let's get you started.</h1>

          <p className="auth-subtitle">
            Create your account once. After that, requesting shopping,
            errands and deliveries will be much faster.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* FORM */}
        <form className="auth-form" onSubmit={handleRegister}>
          <label className="field">
            <span>Full name</span>

            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
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
            <span>Email</span>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>

            <input
              type="password"
              placeholder="At least 6 characters"
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
          No OTP required. Your account is created using your email
          and password.
        </div>
      </div>
    </div>
  );
}