import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "./services/firebase";
import { api } from "./services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("");
  const [error, setError] = useState("");

  async function finishLogin(firebaseUser) {
    const idToken = await firebaseUser.getIdToken(true);

    const result = await api("/api/auth/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    const user = result.user;

    if (!user) {
      throw new Error(
        "Your NITUME profile could not be loaded. Please try again."
      );
    }

    if (onLogin) {
      onLogin(user.role || "CUSTOMER");
    }

    const from = location.state?.from;

    if (from?.pathname) {
      navigate(
        `${from.pathname}${from.search || ""}${from.hash || ""}`,
        { replace: true }
      );
      return;
    }

    navigate(
      user.role === "ADMIN" ? "/operator" : "/",
      { replace: true }
    );
  }

  async function login(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setAuthMethod("email");

      const credential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      await finishLogin(credential.user);
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage = "Unable to sign in.";

      if (
        [
          "auth/invalid-credential",
          "auth/wrong-password",
          "auth/user-not-found",
        ].includes(err.code)
      ) {
        errorMessage = "Incorrect email or password.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/user-disabled") {
        errorMessage =
          "This account has been disabled. Please contact support.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage =
          "Too many login attempts. Please wait a moment and try again.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Check your internet connection and try again.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setAuthMethod("");
    }
  }

  async function loginWithGoogle() {
    if (loading) return;

    setError("");

    try {
      setLoading(true);
      setAuthMethod("google");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const credential = await signInWithPopup(auth, provider);

      await finishLogin(credential.user);
    } catch (err) {
      console.error("Google login error:", err);

      let errorMessage = "Unable to sign in with Google.";

      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Google sign-in was cancelled. You can try again.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage =
          "Your browser blocked the Google sign-in popup. Allow popups and retry.";
      } else if (err.code === "auth/unauthorized-domain") {
        errorMessage =
          "This website domain is not authorized in Firebase Authentication.";
      } else if (
        err.code === "auth/account-exists-with-different-credential"
      ) {
        errorMessage =
          "An account already exists with this email. Try your original sign-in method.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage =
          "Google sign-in is not enabled in Firebase Authentication.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Check your internet connection and try again.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setAuthMethod("");
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
          <div className="eyebrow">WELCOME BACK</div>
          <h1>Good to see you.</h1>

          <p className="auth-subtitle">
            Sign in to request shopping, errands and local
            delivery help around your area.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="google-auth-button"
          onClick={loginWithGoogle}
          disabled={loading}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.93 46.98 31.7 46.98 24.55Z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
            />
          </svg>

          <span>
            {loading && authMethod === "google"
              ? "Connecting to Google..."
              : "Continue with Google"}
          </span>
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form className="auth-form" onSubmit={login}>
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
              required
              disabled={loading}
            />
          </label>

          <label className="field">
            <span>Password</span>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                disabled={loading}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading && authMethod === "email"
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="auth-note">
          Don't have an account?{" "}
          <Link to="/signup" className="text-link">
            Create one
          </Link>
        </div>

        <div className="auth-note">
          You can browse NITUME without an account. An account
          is only needed when you want to request a delivery.
        </div>
      </div>
    </div>
  );
}
