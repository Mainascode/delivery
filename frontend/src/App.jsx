import React from "react";
import {
Navigate,
NavLink,
Outlet,
Route,
Routes,
useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import Request from "./Request";
import Orders from "./Orders";
import Community from "./Community";
import Settings from "./Settings";

import AdminDashboard from "./AdminDashboard/AdminDashboard";
import AdminOrders from "./AdminDashboard/AdminOrders";
import AdminOrderDetails from "./AdminDashboard/AdminOrderDetails";
import AdminSettings from "./AdminDashboard/AdminSettings";

import "./index.css";

/* =========================================================
GENERAL HELPERS
========================================================= */

function LoadingScreen() {
return ( <div className="loading-screen"> <div className="loading-logo">N</div> <div className="spinner" /> <p>Loading NITUME...</p> </div>
);
}

function NotFound() {
return ( <div className="page not-found-page"> <div className="not-found-card"> <span className="eyebrow">NITUME</span>


    <div className="not-found-number">404</div>

    <h1>Page not found</h1>

    <p>
      The page you're looking for doesn't exist
      or may have been moved.
    </p>

    <NavLink
      to="/"
      className="btn btn-primary"
    >
      Back home
    </NavLink>
  </div>
</div>


);
}

/* =========================================================
PROTECTED ROUTES
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
replace
state={{
from: location.pathname,
}}
/>
);
}

return <Outlet />;
}

function AdminRoute() {
const { user, profile, loading } = useAuth();

if (loading) {
return <LoadingScreen />;
}

if (!user) {
return <Navigate to="/login" replace />;
}

if (profile?.role !== "ADMIN") {
return <Navigate to="/" replace />;
}

return <Outlet />;
}

/* =========================================================
CUSTOMER LAYOUT
========================================================= */

function CustomerLayout() {
const { user, profile, logout } = useAuth();

const displayName =
profile?.name ||
user?.displayName ||
"Customer";

const firstName =
displayName.split(" ")[0] || "Customer";

return ( <div className="app-shell">


  {/* DESKTOP SIDEBAR */}
  <aside className="sidebar">

    <div className="sidebar-brand">
      <NavLink to="/" className="brand-link">
        <div className="brand-mark">N</div>

        <div>
          <strong>NITUME</strong>
          <span>Ruaka · Gathigi Estate</span>
        </div>
      </NavLink>
    </div>

    <div className="sidebar-user">
      <div className="user-avatar">
        {firstName.charAt(0).toUpperCase()}
      </div>

      <div>
        <strong>{firstName}</strong>
        <span>Customer</span>
      </div>
    </div>

    <nav className="sidebar-nav">

      <span className="nav-section-label">
        MENU
      </span>

      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="nav-symbol">⌂</span>
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
        <span className="nav-symbol">▤</span>
        <span>My Orders</span>
      </NavLink>

      <NavLink
        to="/community"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="nav-symbol">⌂</span>
        <span>Community</span>
      </NavLink>

      <span className="nav-section-label">
        ACCOUNT
      </span>

      <NavLink
        to="/details"
        className={({ isActive }) =>
          isActive ? "active" : ""
        }
      >
        <span className="nav-symbol">◯</span>
        <span>Profile</span>
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

    <div className="sidebar-bottom">

{String(profile?.role || "").toUpperCase() === "ADMIN" && (
  <NavLink
    to="/operator"
    className="admin-switch-link"
  >
    <span>▣</span>
    <span>Operator Dashboard</span>
  </NavLink>
)}

      {user && (
        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          <span>↪</span>
          <span>Sign out</span>
        </button>
      )}

    </div>
  </aside>

  {/* CUSTOMER CONTENT */}
  <main className="app-content">

    <header className="customer-topbar">

      <div>
        <span className="topbar-location">
          📍 Ruaka · Gathigi Estate
        </span>
      </div>

      <div className="topbar-account">
        <div className="topbar-avatar">
          {firstName.charAt(0).toUpperCase()}
        </div>

        <span>{firstName}</span>
      </div>

    </header>

    <div className="main-content">
      <Outlet />
    </div>

  </main>

  {/* MOBILE BOTTOM NAV */}
  <nav className="mobile-bottom-nav">

    <NavLink
      to="/"
      end
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <span>⌂</span>
      <small>Home</small>
    </NavLink>

    <NavLink
      to="/orders"
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <span>▤</span>
      <small>Orders</small>
    </NavLink>

    <NavLink
      to="/request"
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <span className="mobile-nav-main">＋</span>
      <small>Request</small>
    </NavLink>

    <NavLink
      to="/community"
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <span>⌂</span>
      <small>Community</small>
    </NavLink>

    <NavLink
      to="/settings"
      className={({ isActive }) =>
        isActive ? "active" : ""
      }
    >
      <span>⚙</span>
      <small>Settings</small>
    </NavLink>

  </nav>
</div>


);
}

/* =========================================================
ADMIN LAYOUT
========================================================= */

function AdminLayout() {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const adminName =
    profile?.name ||
    user?.displayName ||
    "Operator";

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="admin-shell">

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <NavLink
            to="/operator"
            className="admin-brand-link"
          >
            <div className="admin-brand-mark">
              N
            </div>

            <div>
              <strong>NITUME</strong>
              <span>Operator</span>
            </div>
          </NavLink>
        </div>

        <div className="admin-profile">
          <div className="admin-profile-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <nav className="admin-nav">

          <span className="admin-nav-label">
            OPERATIONS
          </span>

          <NavLink
            to="/operator"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>▦</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/operator/orders"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>▤</span>
            <span>Orders</span>
          </NavLink>

          <span className="admin-nav-label">
            SYSTEM
          </span>

          <NavLink
            to="/operator/settings"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>⚙</span>
            <span>Settings</span>
          </NavLink>

        </nav>

        <div className="admin-sidebar-bottom">

          <NavLink
            to="/"
            className="admin-customer-link"
          >
            <span>←</span>
            <span>Customer site</span>
          </NavLink>

          <button
            type="button"
            className="admin-logout"
            onClick={logout}
          >
            <span>↪</span>
            <span>Sign out</span>
          </button>

        </div>
      </aside>


      {/* =====================================================
          MOBILE HEADER
      ===================================================== */}
      <header className="admin-mobile-header">

        <NavLink
          to="/operator"
          className="admin-mobile-brand"
        >
          <div className="admin-brand-mark">
            N
          </div>

          <div>
            <strong>NITUME</strong>
            <span>Operator</span>
          </div>
        </NavLink>

        <button
          type="button"
          className="admin-mobile-menu-button"
          aria-label="Open admin menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <span>☰</span>
        </button>

      </header>


      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="admin-mobile-backdrop"
          aria-label="Close admin menu"
          onClick={closeMobileMenu}
        />
      )}


      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}
      <aside
        className={`admin-mobile-drawer ${
          mobileMenuOpen ? "open" : ""
        }`}
        aria-hidden={!mobileMenuOpen}
      >

        <div className="admin-mobile-drawer-header">

          <div className="admin-brand-link">

            <div className="admin-brand-mark">
              N
            </div>

            <div>
              <strong>NITUME</strong>
              <span>Operator</span>
            </div>

          </div>

          <button
            type="button"
            className="admin-mobile-close"
            aria-label="Close admin menu"
            onClick={closeMobileMenu}
          >
            ×
          </button>

        </div>


        <div className="admin-profile">

          <div className="admin-profile-avatar">
            {adminName.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>

        </div>


        <nav className="admin-nav">

          <span className="admin-nav-label">
            OPERATIONS
          </span>

          <NavLink
            to="/operator"
            end
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>▦</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/operator/orders"
            end
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>▤</span>
            <span>Orders</span>
          </NavLink>

          <span className="admin-nav-label">
            SYSTEM
          </span>

          <NavLink
            to="/operator/settings"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            <span>⚙</span>
            <span>Settings</span>
          </NavLink>

        </nav>


        <div className="admin-sidebar-bottom">

          <NavLink
            to="/"
            className="admin-customer-link"
            onClick={closeMobileMenu}
          >
            <span>←</span>
            <span>Customer site</span>
          </NavLink>

          <button
            type="button"
            className="admin-logout"
            onClick={logout}
          >
            <span>↪</span>
            <span>Sign out</span>
          </button>

        </div>

      </aside>


      {/* =====================================================
          ADMIN CONTENT
      ===================================================== */}
      <main className="admin-content">

        <div className="admin-main">
          <Outlet />
        </div>

      </main>

    </div>
  );
}

/* =========================================================
DETAILS PAGE
========================================================= */

function DetailsPage() {
const { profile, user } = useAuth();

return ( <div className="page details-page">


  <div className="page-heading">
    <span className="eyebrow">
      YOUR ACCOUNT
    </span>

    <h1>Your Details</h1>

    <p>
      Your account information used for NITUME
      deliveries.
    </p>
  </div>

  <section className="page-card details-card">

    <div className="details-profile">

      <div className="details-avatar">
        {(profile?.name ||
          user?.displayName ||
          "U")
          .charAt(0)
          .toUpperCase()}
      </div>

      <div>
        <h2>
          {profile?.name ||
            user?.displayName ||
            "Customer"}
        </h2>

        <p>
          {profile?.email ||
            user?.email ||
            "No email"}
        </p>
      </div>

    </div>

    <div className="details-list">

      <div>
        <span>Name</span>
        <strong>
          {profile?.name ||
            user?.displayName ||
            "Not provided"}
        </strong>
      </div>

      <div>
        <span>Email</span>
        <strong>
          {profile?.email ||
            user?.email ||
            "Not provided"}
        </strong>
      </div>

      <div>
        <span>Phone</span>
        <strong>
          {profile?.phone ||
            user?.phoneNumber ||
            "Not provided"}
        </strong>
      </div>

    </div>

  </section>

</div>


);
}

/* =========================================================
APP ROUTES
========================================================= */

export default function NitumeApp() {
return ( <Routes>


  {/* PUBLIC CUSTOMER AREA */}
  <Route element={<CustomerLayout />}>

    <Route
      path="/"
      element={<Home />}
    />


    <Route
      path="/community"
      element={<Community />}
    />

    <Route
      path="/login"
      element={<Login />}
    />

    <Route
      path="/signup"
      element={<Register />}
    />

    {/* CUSTOMER PROTECTED AREA */}
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
        path="/orders/:id"
        element={
          <div className="page">
            <Orders />
          </div>
        }
      />

      <Route
        path="/details"
        element={<DetailsPage />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

    </Route>

  </Route>

  {/* ADMIN AREA */}
  <Route element={<AdminRoute />}>

    <Route element={<AdminLayout />}>

      <Route
        path="/operator"
        element={<AdminDashboard />}
      />

      <Route
        path="/operator/orders"
        element={<AdminOrders />}
      />

      <Route
        path="/operator/orders/:id"
        element={<AdminOrderDetails />}
      />

      <Route
        path="/operator/settings"
        element={<AdminSettings />}
      />

    </Route>

  </Route>

  {/* FALLBACK */}
  <Route
    path="*"
    element={<NotFound />}
  />

</Routes>


);
}
