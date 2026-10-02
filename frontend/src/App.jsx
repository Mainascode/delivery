import { useEffect } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Home from "./Home";
import Help from "./Help";
import Login from "./Login";
import Register from "./Register";
import Request from "./Request";
import Orders from "./Orders";
import Settings from "./Settings";

import "./index.css";

/* =========================================================
   LOADING
   ========================================================= */

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="brand-mark">N</div>

        <p className="eyebrow">NITUME</p>

        <h1>Loading...</h1>

        <p>
          Getting your NITUME account ready.
        </p>

        <div className="loading-spinner" />
      </div>
    </div>
  );
}

/* =========================================================
   HOME ICON
   ========================================================= */

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 10.8L12 3l9 7.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5.5 9.5V21h13V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9.5 21v-6h5v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   AUTH GUARD
   ========================================================= */

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  /*
   * Firebase user exists but MongoDB profile has not
   * loaded yet. Let the page continue; AuthContext
   * handles profile loading.
   */
  return children;
}

/* =========================================================
   CUSTOMER TOP BAR
   ========================================================= */

function CustomerTopBar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="mobile-topbar">
      <button
        type="button"
        className="home-icon-button"
        onClick={() => navigate("/")}
        aria-label="Go to home"
        title="Home"
      >
        <HomeIcon />
      </button>

      <NavLink to="/" className="topbar-brand">
        <span className="topbar-brand-mark">N</span>

        <span>
          <strong>NITUME</strong>
          <small>Ruaka · Gathigi Estate</small>
        </span>
      </NavLink>

      {!user ? (
        <NavLink
          to="/login"
          className="topbar-login"
        >
          Sign in
        </NavLink>
      ) : (
        <span className="topbar-user">
          {profile?.name?.split(" ")[0] ||
            user.displayName?.split(" ")[0] ||
            "Account"}
        </span>
      )}
    </header>
  );
}

/* =========================================================
   CUSTOMER SIDEBAR
   ========================================================= */

function CustomerSidebar() {
  const { user, profile } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <NavLink to="/" className="brand">
          <div className="brand-mark">N</div>

          <div>
            <strong>NITUME</strong>
            <span>Ruaka · Gathigi Estate</span>
          </div>
        </NavLink>

        <nav className="side-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <HomeIcon />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/request"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span className="nav-symbol">＋</span>
            <span>Request delivery</span>
          </NavLink>

          <NavLink
            to="/orders"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span className="nav-symbol">▣</span>
            <span>My orders</span>
          </NavLink>

          <NavLink
            to="/details"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span className="nav-symbol">◉</span>
            <span>Your details</span>
          </NavLink>

          <NavLink
            to="/help"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span className="nav-symbol">?</span>
            <span>Help</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span className="nav-symbol">⚙</span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-bottom">
        {user ? (
          <div className="sidebar-account">
            <span className="status-dot" />

            <div>
              <strong>
                {profile?.name ||
                  user.displayName ||
                  "NITUME customer"}
              </strong>

              <span>
                {profile?.phone ||
                  user.email ||
                  ""}
              </span>
            </div>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="sidebar-signin"
          >
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  );
}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function CustomerMobileNav() {
  const { user } = useAuth();

  return (
    <nav className="mobile-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <HomeIcon />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/request"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="mobile-nav-icon">＋</span>
        <span>Request</span>
      </NavLink>

      {user ? (
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <span className="mobile-nav-icon">▣</span>
          <span>Orders</span>
        </NavLink>
      ) : (
        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <span className="mobile-nav-icon">→</span>
          <span>Sign in</span>
        </NavLink>
      )}

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="mobile-nav-icon">⚙</span>
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}

/* =========================================================
   CUSTOMER LAYOUT
   ========================================================= */

function CustomerLayout() {
  const location = useLocation();

  /*
   * Authentication pages should not have the customer
   * sidebar/layout.
   */
  const authPage =
    location.pathname === "/login" ||
    location.pathname === "/signup";

  if (authPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Register />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <CustomerSidebar />

      <div className="app-content">
        <CustomerTopBar />

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/help"
              element={<Help />}
            />

            <Route
              path="/request"
              element={
                <ProtectedRoute>
                  <Request />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/details"
              element={
                <ProtectedRoute>
                  <DetailsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </main>
      </div>

      <CustomerMobileNav />
    </div>
  );
}

/* =========================================================
   DETAILS
   ========================================================= */

function DetailsPage() {
  const { profile, user } = useAuth();

  return (
    <div className="page">
      <div className="page-toolbar">
        <button
          type="button"
          className="home-button"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          <HomeIcon />
          <span>Home</span>
        </button>
      </div>

      <header className="page-header">
        <div>
          <p className="eyebrow">ACCOUNT</p>

          <h1>Your details</h1>

          <p className="page-description">
            Your NITUME account information.
          </p>
        </div>
      </header>

      <div className="details-grid">
        <article className="detail-card">
          <span>Name</span>
          <strong>
            {profile?.name ||
              user?.displayName ||
              "Not provided"}
          </strong>
        </article>

        <article className="detail-card">
          <span>Email</span>
          <strong>
            {profile?.email ||
              user?.email ||
              "Not provided"}
          </strong>
        </article>

        <article className="detail-card">
          <span>Phone</span>
          <strong>
            {profile?.phone ||
              user?.phoneNumber ||
              "Not provided"}
          </strong>
        </article>

        <article className="detail-card">
          <span>Account type</span>
          <strong>
            {profile?.role || "CUSTOMER"}
          </strong>
        </article>
      </div>
    </div>
  );
}

/* =========================================================
   404
   ========================================================= */

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="empty-card not-found-card">
        <div className="not-found-number">
          404
        </div>

        <p className="eyebrow">
          PAGE NOT FOUND
        </p>

        <h1>This page isn't available.</h1>

        <p>
          The page may have moved or the address may
          be incorrect.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate("/")}
        >
          <HomeIcon />
          Go home
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function NitumeApp() {
  return (
    <Routes>
      <Route
        path="/*"
        element={<CustomerLayout />}
      />
    </Routes>
  );
}

