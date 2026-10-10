import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./services/firebase";
import { api } from "./services/api";

export default function Login({ onLogin }) {
const navigate = useNavigate();
const location = useLocation();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

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

  // 1. Sign in with Firebase.
  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  const firebaseUser = credential.user;

  // 2. Obtain a fresh Firebase ID token.
  const idToken = await firebaseUser.getIdToken(true);

  // 3. Retrieve the profile from the Render backend.
  const result = await api("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  const user = result.user;

  if (!user) {
    throw new Error(
      "Your account profile could not be loaded. Please try again."
    );
  }

  console.log("Login successful:", user);

  // 4. Update the application's authentication state.
  if (onLogin) {
    onLogin(user.role);
  }

  // 5. Return to the originally requested page if applicable.
  const from = location.state?.from;

  if (from?.pathname) {
    navigate(
      `${from.pathname}${from.search || ""}${from.hash || ""}`,
      { replace: true }
    );
    return;
  }

  // 6. Navigate according to the user's role.
  if (user.role === "ADMIN") {
    navigate("/operator", { replace: true });
  } else {
    navigate("/", { replace: true });
  }
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

        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
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