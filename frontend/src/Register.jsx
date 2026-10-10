import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "./services/firebase";
import { api } from "./services/api";

// Accept 07XXXXXXXX or +2547XXXXXXXX.
function normalizeKenyanPhone(phone) {
  const number = phone.replace(/[\s()-]/g, "");

  if (/^07\d{8}$/.test(number)) {
    return `+254${number.slice(1)}`;
  }

  if (/^\+2547\d{8}$/.test(number)) {
    return number;
  }

  return null;
}

export default function Register({ onLogin }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function register(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeKenyanPhone(phone);

    if (
      !cleanName ||
      !phone.trim() ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (!normalizedPhone) {
      setError(
        "Enter a valid Kenyan mobile number, e.g. 0712345678 or +254712345678."
      );
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

      // 1. Create the Firebase account.
      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const firebaseUser = credential.user;

      // 2. Save the user's display name in Firebase.
      await updateProfile(firebaseUser, {
        displayName: cleanName,
      });

      // 3. Obtain a fresh Firebase ID token.
      const idToken = await firebaseUser.getIdToken(true);

      // 4. Save the user's profile in the Render backend.
      const result = await api("/api/auth/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: cleanName,
          phone: normalizedPhone,
        }),
      });

      const registeredProfile = result.user;

      console.log("Registration successful:", result);

      setMessage("Account created successfully.");

      // 5. Update authentication state and navigate.
      if (onLogin) {
        onLogin(registeredProfile?.role || "CUSTOMER");
      }

      navigate(
        registeredProfile?.role === "ADMIN"
          ? "/operator"
          : "/",
        { replace: true }
      );
    } catch (err) {
      console.error("Registration error:", err);

      let errorMessage = "Unable to create your account.";

      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          "An account with this email already exists. Please sign in.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Please choose a stronger password.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage =
          "Email and password sign-up is not enabled in Firebase.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Check your internet connection and try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">N</div>

          <div>
            <div className="brand-name">NITUME</div>
            <div className="brand-location">
              RUAKA · GATHIGI ESTATE
            </div>
          </div>
        </div>

        <div className="auth-heading">
          <div className="eyebrow">GET STARTED</div>
          <h1>Need a hand?</h1>

          <p className="auth-subtitle">
            Create your NITUME account and start requesting
            shopping, errands and deliveries around your area.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="alert alert-success" role="status">
            {message}
          </div>
        )}

        <form className="auth-form" onSubmit={register}>
          <label className="field">
            <span>Full name</span>

            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              autoCapitalize="words"
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Phone number</span>

            <input
              type="tel"
              placeholder="07XX XXX XXX or +254 7XX XXX XXX"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Email</span>

            <input
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>

            <div className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((visible) => !visible)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="field">
            <span>Confirm password</span>

            <div className="password-input-wrap">
              <input
                type={
                  showConfirmPassword ? "text" : "password"
                }
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (visible) => !visible
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                aria-pressed={showConfirmPassword}
                disabled={loading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-note">
          Already have an account?{" "}
          <Link to="/login" className="text-link">
            Sign in
          </Link>
        </div>

        <div className="auth-note">
          By creating an account, you can request shopping,
          errands and local delivery help through NITUME.
        </div>
      </div>
    </div>
  );
}
