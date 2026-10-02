import {
Navigate,
NavLink,
Outlet,
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

import AdminDashboard from "./AdminDashboard/AdminDashboard";
import AdminOrders from "./AdminDashboard/AdminOrders";
import AdminSettings from "./AdminDashboard/AdminSettings";

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

    <p>Getting your NITUME account ready.</p>

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
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
<path d="M3 10.8L12 3l9 7.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

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
ADMIN ICON
========================================================= */

function AdminIcon() {
return (
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" >
<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />

  <path
    d="M8 15h2M12 11v4M16 8v7"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  />
</svg>

);
}

/* =========================================================
PROTECTED CUSTOMER ROUTE
========================================================= */

function ProtectedRoute() {
const { user, loading } = useAuth();
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

return <Outlet />;
}

/* =========================================================
ADMIN ROUTE
========================================================= */

function AdminRoute() {
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

Firebase authentication can finish before the MongoDB
profile has been loaded. Wait instead of incorrectly
redirecting an admin to the customer area.
*/
if (!profile) {
return <LoadingScreen />;
}

if (profile.role !== "ADMIN") {
return <Navigate to="/" replace />;
}

return <Outlet />;
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

      {profile?.role === "ADMIN" && (
        <NavLink
          to="/operator"
          className={({ isActive }) =>
            isActive
              ? "active admin-nav-link"
              : "admin-nav-link"
          }
        >
          <AdminIcon />
          <span>Admin panel</span>
        </NavLink>
      )}
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
CUSTOMER MOBILE NAVIGATION
========================================================= */

function CustomerMobileNav() {
const { user, profile } = useAuth();

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

  {profile?.role === "ADMIN" && (
    <NavLink
      to="/operator"
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <AdminIcon />
      <span>Admin</span>
    </NavLink>
  )}
</nav>

);
}

/* =========================================================
CUSTOMER LAYOUT
========================================================= */

function CustomerLayout() {
return (
<div className="app-shell">
<CustomerSidebar />

  <div className="app-content">
    <CustomerTopBar />

    <main className="main-content">
      <Outlet />
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
const navigate = useNavigate();

return (
<div className="page">
<div className="page-toolbar">
<button
type="button"
className="home-button"
onClick={() => navigate("/")}
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
ADMIN LAYOUT
========================================================= */

function AdminLayout() {
const { profile, user, logout } = useAuth();

return (
<div className="admin-shell">
<aside className="admin-sidebar">
<div className="admin-sidebar-top">
<NavLink to="/operator" end className="admin-brand" >
<div className="brand-mark">N</div>

        <div>
          <strong>NITUME</strong>
          <span>ADMIN PANEL</span>
        </div>
      </NavLink>

      <nav className="admin-nav">
        <NavLink
          to="/operator"
          end
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <AdminIcon />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/operator/orders"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <span className="nav-symbol">▣</span>
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/operator/settings"
          className={({ isActive }) =>
            isActive ? "active" : ""
          }
        >
          <span className="nav-symbol">⚙</span>
          <span>Settings</span>
        </NavLink>

        <NavLink
          to="/"
          className="admin-customer-link"
        >
          <HomeIcon />
          <span>Customer app</span>
        </NavLink>
      </nav>
    </div>

    <div className="admin-sidebar-bottom">
      <div className="admin-account">
        <span className="status-dot" />

        <div>
          <strong>
            {profile?.name ||
              user?.displayName ||
              "Administrator"}
          </strong>

          <span>
            {user?.email || ""}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="admin-logout"
        onClick={logout}
      >
        Sign out
      </button>
    </div>
  </aside>

  <div className="admin-content">
    <header className="admin-topbar">
      <div>
        <span className="eyebrow">
          NITUME OPERATIONS
        </span>

        <strong>Admin panel</strong>
      </div>

      <div className="admin-topbar-user">
        <span className="status-dot" />

        <span>
          {profile?.name ||
            user?.displayName ||
            "Administrator"}
        </span>
      </div>
    </header>

    <main className="admin-main">
      <Outlet />
    </main>
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
APP ROUTES
========================================================= */

export default function NitumeApp() {
return (
<Routes>
{/* =====================================================
PUBLIC AUTH PAGES
===================================================== */}

  <Route
    path="/login"
    element={<Login />}
  />

  <Route
    path="/signup"
    element={<Register />}
  />

  {/* =====================================================
      CUSTOMER APP
      ===================================================== */}

  <Route element={<CustomerLayout />}>
    <Route
      path="/"
      element={<Home />}
    />

    <Route
      path="/help"
      element={<Help />}
    />

    <Route element={<ProtectedRoute />}>
      <Route
        path="/request"
        element={<Request />}
      />

      <Route
        path="/orders"
        element={<Orders />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="/details"
        element={<DetailsPage />}
      />
    </Route>
  </Route>

  {/* =====================================================
      ADMIN / OPERATOR APP
      ===================================================== */}

  <Route element={<AdminRoute />}>
    <Route
      path="/operator"
      element={<AdminLayout />}
    >
      <Route
        index
        element={<AdminDashboard />}
      />

      <Route
        path="orders"
        element={<AdminOrders />}
      />

      <Route
        path="settings"
        element={<AdminSettings />}
      />
    </Route>
  </Route>

  {/* =====================================================
      404
      ===================================================== */}

  <Route
    path="*"
    element={<NotFound />}
  />
</Routes>

);
}