import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { auth } from "./services/firebase";
import { api } from "./services/api";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState("");
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
      setAuthMethod("email");

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const firebaseUser = credential.user;

      await updateProfile(firebaseUser, {
        displayName: cleanName,
      });

      const idToken = await firebaseUser.getIdToken(true);

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

      if (onLogin) {
        onLogin(registeredProfile?.role || "CUSTOMER");
      }

      navigate(
        registeredProfile?.role === "ADMIN" ? "/operator" : "/",
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
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setAuthMethod("");
    }
  }

  async function handleGoogleAuth() {
    if (loading) return;

    setError("");
    setMessage("");

    try {
      setLoading(true);
      setAuthMethod("google");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;
      const idToken = await firebaseUser.getIdToken(true);

      const googleName =
        firebaseUser.displayName?.trim() ||
        firebaseUser.email?.split("@")[0] ||
        "NITUME Customer";

      // The backend auth middleware should find or create this user's
      // MongoDB profile. PATCH updates the name without overwriting a
      // phone number already saved on an existing account.
      const result = await api("/api/auth/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: googleName,
        }),
      });

      const registeredProfile = result.user;

      if (!registeredProfile) {
        throw new Error(
          "Google sign-in succeeded, but your NITUME profile could not be loaded."
        );
      }

      if (onLogin) {
        onLogin(registeredProfile.role || "CUSTOMER");
      }

      navigate(
        registeredProfile.role === "ADMIN" ? "/operator" : "/",
        { replace: true }
      );
    } catch (err) {
      console.error("Google registration error:", err);

      let errorMessage = "Unable to continue with Google.";

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
          "An account already exists with this email. Try signing in using your original method.";
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage =
          "Google sign-in is not enabled. Enable Google in Firebase Authentication.";
      } else if (err.code === "auth/network-request-failed") {
        errorMessage =
          "Network error. Check your connection and try again.";
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

        <button
          type="button"
          className="google-auth-button"
          onClick={handleGoogleAuth}
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
          <span>or sign up with email</span>
        </div>

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
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                disabled={loading}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword((visible) => !visible)
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
            {loading && authMethod === "email"
              ? "Creating account..."
              : "Create account"}
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
