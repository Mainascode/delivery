import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";

import Home from "./Home.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import Orders from "./Orders.jsx";
import Request from "./Request.jsx";
import Help from "./Help.jsx";
import Settings from "./Settings.jsx";

import "./index.css";

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <div className="loading-logo">N</div>
        <h2>NITUME</h2>
        <p>Loading your account...</p>
        <div className="loading-spinner" />
      </div>
    </div>
  );
}

/* =========================================================
   404
========================================================= */

function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found-card">
        <span className="not-found-code">404</span>

        <h1>Page not found</h1>

        <p>
          The page you're looking for doesn't exist.
        </p>

        <NavLink to="/" className="primary-button">
          Go home
        </NavLink>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOMER NAVIGATION
========================================================= */

const customerNavigation = [
  {
    path: "/",
    label: "Home",
    icon: "⌂",
    end: true,
  },
  {
    path: "/request",
    label: "Request Rider",
    icon: "＋",
  },
  {
    path: "/orders",
    label: "My Orders",
    icon: "▣",
  },
  {
    path: "/help",
    label: "Help",
    icon: "?",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: "⚙",
  },
];

/* =========================================================
   OPERATOR NAVIGATION
========================================================= */

const operatorNavigation = [
  {
    path: "/operator",
    label: "Dashboard",
    icon: "⌂",
    end: true,
  },
  {
    path: "/operator/orders",
    label: "Incoming Orders",
    icon: "▣",
  },
  {
    path: "/operator/pricing",
    label: "Pricing",
    icon: "◆",
  },
  {
    path: "/operator/settings",
    label: "Settings",
    icon: "⚙",
  },
];

/* =========================================================
   NAVIGATION LINK
========================================================= */

function NavigationLink({ item }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        `navigation-link ${isActive ? "active" : ""}`
      }
    >
      <span className="navigation-icon">
        {item.icon}
      </span>

      <span>{item.label}</span>
    </NavLink>
  );
}

/* =========================================================
   CUSTOMER SIDEBAR
========================================================= */

function CustomerSidebar({ profile }) {
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const name =
    profile?.name ||
    profile?.displayName ||
    profile?.email?.split("@")[0] ||
    "Customer";

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">N</div>

        <div>
          <strong>NITUME</strong>
          <span>Local delivery</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">
          MENU
        </span>

        <nav className="sidebar-navigation">
          {customerNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>{name}</strong>
            <span>Customer</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   OPERATOR SIDEBAR
========================================================= */

function OperatorSidebar({ profile }) {
  const { logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const name =
    profile?.name ||
    profile?.displayName ||
    profile?.email?.split("@")[0] ||
    "Operator";

  return (
    <aside className="desktop-sidebar operator-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">N</div>

        <div>
          <strong>NITUME</strong>
          <span>Operator</span>
        </div>
      </div>

      <div className="operator-badge">
        <span className="operator-badge-dot" />
        Operator mode
      </div>

      <div className="sidebar-section">
        <span className="sidebar-section-title">
          OPERATIONS
        </span>

        <nav className="sidebar-navigation">
          {operatorNavigation.map((item) => (
            <NavigationLink
              key={item.path}
              item={item}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="user-avatar">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>{name}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   MOBILE BOTTOM NAVIGATION
========================================================= */

function MobileBottomNavigation({
  operator = false,
}) {
  const navigation = operator
    ? operatorNavigation
    : customerNavigation.filter((item) =>
        [
          "/",
          "/orders",
          "/request",
          "/settings",
        ].includes(item.path)
      );

  return (
    <nav className="mobile-bottom-nav">
      {navigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={({ isActive }) =>
            `mobile-nav-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="mobile-nav-icon">
            {item.icon}
          </span>

          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* =========================================================
   CUSTOMER HEADER
========================================================= */

function CustomerHeader({ profile }) {
  const location = useLocation();

  const titles = {
    "/": "Home",
    "/orders": "My Orders",
    "/request": "Request a Rider",
    "/help": "Help & Coverage",
    "/settings": "Settings",
  };

  const title =
    titles[location.pathname] || "NITUME";

  const name =
    profile?.name ||
    profile?.displayName ||
    profile?.email?.split("@")[0] ||
    "Customer";

  return (
    <header className="mobile-top-header">
      <div>
        <span className="mobile-header-eyebrow">
          NITUME
        </span>

        <h1>{title}</h1>
      </div>

      <div className="mobile-header-avatar">
        {name.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}

/* =========================================================
   OPERATOR HEADER
========================================================= */

function OperatorHeader({ profile }) {
  const location = useLocation();

  const titles = {
    "/operator": "Dashboard",
    "/operator/orders": "Incoming Orders",
    "/operator/pricing": "Pricing",
    "/operator/settings": "Settings",
  };

  const title =
    titles[location.pathname] || "Operator";

  const name =
    profile?.name ||
    profile?.displayName ||
    profile?.email?.split("@")[0] ||
    "Operator";

  return (
    <header className="mobile-top-header operator-mobile-header">
      <div>
        <span className="mobile-header-eyebrow">
          NITUME OPERATOR
        </span>

        <h1>{title}</h1>
      </div>

      <div className="mobile-header-avatar">
        {name.charAt(0).toUpperCase()}
      </div>
    </header>
  );
}

/* =========================================================
   CUSTOMER AUTHENTICATED LAYOUT
========================================================= */

function CustomerLayout({ profile }) {
  return (
    <div className="app-shell">
      <CustomerSidebar profile={profile} />

      <div className="app-main">
        <CustomerHeader profile={profile} />

        <main className="page-content">
          <Routes>
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
              element={<OrderDetailsFallback />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

            <Route
              path="/help"
              element={<Help />}
            />

            <Route
              path="/details"
              element={<DetailsFallback />}
            />

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </main>
      </div>

      <MobileBottomNavigation />
    </div>
  );
}

/* =========================================================
   OPERATOR LAYOUT
========================================================= */

function OperatorLayout({ profile }) {
  return (
    <div className="app-shell operator-shell">
      <OperatorSidebar profile={profile} />

      <div className="app-main">
        <OperatorHeader profile={profile} />

        <main className="page-content">
          <Routes>
            <Route
              path="/operator"
              element={<OperatorDashboard />}
            />

            <Route
              path="/operator/orders"
              element={<OperatorOrders />}
            />

            <Route
              path="/operator/orders/:id"
              element={<OperatorOrderDetails />}
            />

            <Route
              path="/operator/pricing"
              element={<OperatorPricing />}
            />

            <Route
              path="/operator/settings"
              element={<OperatorSettings />}
            />

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </main>
      </div>

      <MobileBottomNavigation operator />
    </div>
  );
}

/* =========================================================
   FALLBACK PAGES
========================================================= */

function OrderDetailsFallback() {
  const location = useLocation();

  const id = location.pathname
    .split("/")
    .filter(Boolean)
    .pop();

  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">ORDER</span>

        <h2>Order details</h2>
      </div>

      <p>
        Order <strong>#{id}</strong> details will
        appear here.
      </p>

      <NavLink
        to="/orders"
        className="primary-button"
      >
        Back to orders
      </NavLink>
    </div>
  );
}

function DetailsFallback() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">ACCOUNT</span>

        <h2>Your details</h2>
      </div>

      <p>
        Your account details page is ready to be
        connected.
      </p>

      <NavLink
        to="/settings"
        className="primary-button"
      >
        Go to settings
      </NavLink>
    </div>
  );
}

function OperatorDashboard() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">OPERATOR</span>

        <h2>Dashboard</h2>
      </div>

      <p>
        Operator dashboard is ready to be connected
        to the backend.
      </p>
    </div>
  );
}

function OperatorOrders() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">ORDERS</span>

        <h2>Incoming orders</h2>
      </div>

      <p>Incoming orders will appear here.</p>
    </div>
  );
}

function OperatorOrderDetails() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">ORDER</span>

        <h2>Order details</h2>
      </div>

      <p>
        Operator order details will appear here.
      </p>
    </div>
  );
}

function OperatorPricing() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">PRICING</span>

        <h2>Delivery pricing</h2>
      </div>

      <p>
        Pricing management will appear here.
      </p>
    </div>
  );
}

function OperatorSettings() {
  return (
    <div className="page-card">
      <div className="page-card-header">
        <span className="eyebrow">SETTINGS</span>

        <h2>Operator settings</h2>
      </div>

      <p>
        Operator settings will appear here.
      </p>
    </div>
  );
}

/* =========================================================
   PROTECTED CUSTOMER ROUTE
========================================================= */

function ProtectedCustomerRoute({ children }) {
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

  return children;
}

/* =========================================================
   PROTECTED OPERATOR ROUTE
========================================================= */

function ProtectedOperatorRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: "/operator",
        }}
      />
    );
  }

  if (profile?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function AuthenticatedApp() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* ================================================
          PUBLIC HOME
      ================================================= */}

      <Route
        path="/"
        element={<Home />}
      />

      {/* ================================================
          PUBLIC HELP
      ================================================= */}

      <Route
        path="/help"
        element={<Help />}
      />

      {/* ================================================
          AUTHENTICATION
      ================================================= */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/" replace />
          ) : (
            <Register />
          )
        }
      />

      {/* ================================================
          PROTECTED CUSTOMER AREA
      ================================================= */}

      <Route
        path="/request"
        element={
          <ProtectedCustomerRoute>
            <CustomerLayout profile={profile} />
          </ProtectedCustomerRoute>
        }
      />

      <Route
        path="/orders/*"
        element={
          <ProtectedCustomerRoute>
            <CustomerLayout profile={profile} />
          </ProtectedCustomerRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedCustomerRoute>
            <CustomerLayout profile={profile} />
          </ProtectedCustomerRoute>
        }
      />

      <Route
        path="/details"
        element={
          <ProtectedCustomerRoute>
            <CustomerLayout profile={profile} />
          </ProtectedCustomerRoute>
        }
      />

      {/* ================================================
          PROTECTED OPERATOR AREA
      ================================================= */}

      <Route
        path="/operator/*"
        element={
          <ProtectedOperatorRoute>
            <OperatorLayout profile={profile} />
          </ProtectedOperatorRoute>
        }
      />

      {/* ================================================
          EVERYTHING ELSE
      ================================================= */}

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

/* =========================================================
   APP
========================================================= */

export default function NitumeApp() {
  return <AuthenticatedApp />;
}