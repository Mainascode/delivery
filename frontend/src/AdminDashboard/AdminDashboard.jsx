import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const STATUS_OPTIONS = [
  {
    value: "ACCEPTED",
    label: "Accept",
  },
  {
    value: "SHOPPING",
    label: "Shopping",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
  },
  {
    value: "COMPLETED",
    label: "Complete",
  },
  {
    value: "CANCELLED",
    label: "Cancel",
  },
];

function normalizeStatus(status) {
  return String(status || "ACCEPTED").toUpperCase();
}

function formatStatus(status) {
  return normalizeStatus(status)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  switch (normalizeStatus(status)) {
    case "COMPLETED":
      return "status-success";

    case "CANCELLED":
      return "status-danger";

    case "ACCEPTED":
    case "SHOPPING":
    case "OUT_FOR_DELIVERY":
      return "status-active";

    default:
      return "";
  }
}

function getOrderId(order) {
  return order?._id || order?.id || "";
}

function getShortId(order) {
  const id = getOrderId(order);

  return id
    ? id.slice(-6).toUpperCase()
    : "UNKNOWN";
}

function getCustomerName(order) {
  return (
    order?.userId?.name ||
    order?.customer?.name ||
    order?.user?.name ||
    order?.customerName ||
    "Customer"
  );
}

function getCustomerEmail(order) {
  return (
    order?.userId?.email ||
    order?.customer?.email ||
    order?.user?.email ||
    order?.customerEmail ||
    ""
  );
}

function getItemsCount(order) {
  if (Array.isArray(order?.items)) {
    return order.items.length;
  }

  if (typeof order?.items === "string") {
    return order.items
      .split("\n")
      .filter(Boolean).length;
  }

  return 0;
}

function getOrderAmount(order) {
  return Number(
    order?.finalTotal ??
      order?.amount ??
      order?.deliveryFee ??
      0
  );
}

function getOrderDate(order) {
  return (
    order?.createdAt ||
    order?.updatedAt ||
    null
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  title,
  value,
  description,
  icon,
  detailKey,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`admin-dashboard-stat ${
        active ? "selected" : ""
      }`}
      onClick={() => onClick(detailKey)}
    >
      <div className="admin-dashboard-stat-top">
        <div className="admin-dashboard-stat-icon">
          {icon}
        </div>

        <span className="admin-dashboard-stat-arrow">
          ↗
        </span>
      </div>

      <div className="admin-dashboard-stat-value">
        {value}
      </div>

      <div className="admin-dashboard-stat-title">
        {title}
      </div>

      <p>{description}</p>
    </button>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="admin-info-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  updating,
}) {
  if (!order) {
    return null;
  }

  const id = getOrderId(order);

  return (
    <div
      className="admin-detail-overlay"
      onClick={onClose}
    >
      <div
        className="admin-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-detail-header">
          <div>
            <span className="eyebrow">
              ORDER #{getShortId(order)}
            </span>

            <h2>Order details</h2>

            <p>
              Submitted {formatDate(getOrderDate(order))}
            </p>
          </div>

          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="admin-detail-body">
          <div className="admin-detail-status-row">
            <span
              className={`status-badge ${getStatusClass(
                order.status
              )}`}
            >
              {formatStatus(order.status)}
            </span>
          </div>

          <section className="admin-detail-section">
            <span className="order-meta-label">
              CUSTOMER
            </span>

            <h3>{getCustomerName(order)}</h3>

            {getCustomerEmail(order) && (
              <p>{getCustomerEmail(order)}</p>
            )}
          </section>

          <section className="admin-detail-section">
            <span className="order-meta-label">
              ITEMS
            </span>

            <div className="admin-detail-box">
              {Array.isArray(order.items) ? (
                <ul className="admin-detail-items">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {typeof item === "string"
                        ? item
                        : item?.name ||
                          item?.description ||
                          "Item"}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>
                  {order.items ||
                    "No item information provided."}
                </p>
              )}
            </div>
          </section>

          <div className="admin-detail-two-column">
            <section className="admin-detail-section">
              <span className="order-meta-label">
                PICKUP
              </span>

              <p>
                {order.pickupLocation ||
                  "Not provided"}
              </p>
            </section>

            <section className="admin-detail-section">
              <span className="order-meta-label">
                DELIVERY
              </span>

              <p>
                {order.deliveryLocation ||
                  "Not provided"}
              </p>
            </section>
          </div>

          {order.notes && (
            <section className="admin-detail-section">
              <span className="order-meta-label">
                NOTES
              </span>

              <div className="admin-detail-box">
                <p>{order.notes}</p>
              </div>
            </section>
          )}

          <div className="admin-detail-financials">
            <InfoPill
              label="Delivery fee"
              value={
                order.deliveryFee != null
                  ? `KES ${order.deliveryFee}`
                  : "—"
              }
            />

            <InfoPill
              label="Order amount"
              value={
                getOrderAmount(order)
                  ? `KES ${getOrderAmount(order)}`
                  : "—"
              }
            />

            <InfoPill
              label="Items"
              value={getItemsCount(order)}
            />
          </div>

          <section className="admin-status-section">
            <div className="admin-status-heading">
              <span>Update order status</span>

              {updating && (
                <small>Updating...</small>
              )}
            </div>

            <div className="admin-status-buttons">
              {STATUS_OPTIONS.map((option) => {
                const selected =
                  normalizeStatus(order.status) ===
                  option.value;

                return (
                  <button
                    type="button"
                    key={option.value}
                    disabled={updating}
                    className={`admin-status-button ${
                      selected ? "selected" : ""
                    } ${
                      option.value === "CANCELLED"
                        ? "danger"
                        : ""
                    }`}
                    onClick={() =>
                      onStatusChange(id, option.value)
                    }
                  >
                    {selected
                      ? "Current"
                      : option.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [selectedStat, setSelectedStat] =
    useState("incoming");

  const [selectedOrder, setSelectedOrder] =
    useState(null);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [dashboardData, ordersData] =
          await Promise.all([
            api("/api/admin/dashboard"),
            api("/api/orders/admin"),
          ]);

        setDashboard(dashboardData);
        setOrders(ordersData.orders || []);
      } catch (err) {
        console.error(
          "Failed to load admin dashboard:",
          err
        );

        setError(
          err.message ||
            "Unable to load the admin dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const incoming = orders.filter(
      (order) =>
        normalizeStatus(order.status) === "ACCEPTED"
    );

    const shopping = orders.filter(
      (order) =>
        normalizeStatus(order.status) === "SHOPPING"
    );

    const delivering = orders.filter(
      (order) =>
        normalizeStatus(order.status) ===
        "OUT_FOR_DELIVERY"
    );

    const completed = orders.filter(
      (order) =>
        normalizeStatus(order.status) === "COMPLETED"
    );

    const cancelled = orders.filter(
      (order) =>
        normalizeStatus(order.status) === "CANCELLED"
    );

    const active = [
      ...shopping,
      ...delivering,
    ];

    const revenue = completed.reduce(
      (total, order) =>
        total + getOrderAmount(order),
      0
    );

    const customers = new Set(
      orders
        .map((order) => {
          return (
            order?.userId?._id ||
            order?.userId ||
            order?.customer?.id ||
            order?.customer?.email ||
            getCustomerEmail(order) ||
            getCustomerName(order)
          );
        })
        .filter(Boolean)
    );

    return {
      incoming,
      shopping,
      delivering,
      active,
      completed,
      cancelled,
      revenue,
      customers: customers.size,
    };
  }, [orders]);

  const pricing = dashboard?.pricing || {};

  const currentFee =
    pricing.fee != null
      ? pricing.fee
      : "--";

  const pricingMode =
    pricing.mode || "Pricing unavailable";

  const selectedOrders = useMemo(() => {
    switch (selectedStat) {
      case "active":
        return stats.active;

      case "completed":
        return stats.completed;

      case "cancelled":
        return stats.cancelled;

      case "shopping":
        return stats.shopping;

      case "delivering":
        return stats.delivering;

      default:
        return stats.incoming;
    }
  }, [selectedStat, stats]);

  async function updateStatus(orderId, status) {
    try {
      setUpdatingId(orderId);
      setError("");

      const data = await api(
        `/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
          }),
        }
      );

      const updatedOrder =
        data.order || data;

      setOrders((current) =>
        current.map((order) =>
          getOrderId(order) === orderId
            ? updatedOrder
            : order
        )
      );

      setSelectedOrder(updatedOrder);

      await loadDashboard(true);
    } catch (err) {
      console.error(
        "Failed to update order:",
        err
      );

      setError(
        err.message ||
          "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="page operator-dashboard-page">
        <div className="loading-card">
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page operator-dashboard-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="page-header">
        <div>
          <div className="eyebrow">
            NITUME / OPERATOR
          </div>

          <h1>Operations overview</h1>

          <p className="page-description">
            Review requests, manage deliveries and keep
            track of what's happening around NITUME.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh dashboard"}
        </button>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>

          <button
            type="button"
            className="alert-action"
            onClick={() => loadDashboard()}
          >
            Try again
          </button>
        </div>
      )}

      {/* =====================================================
          PRICING BANNER
      ===================================================== */}

      <section className="admin-dashboard-banner">
        <div>
          <span className="eyebrow">
            CURRENT DELIVERY PRICING
          </span>

          <h2>
            KES {currentFee}
          </h2>

          <p>
            Current pricing mode:{" "}
            <strong>{pricingMode}</strong>
          </p>
        </div>

        <div className="admin-dashboard-banner-actions">
          <span className="admin-pricing-status">
            <span className="status-dot" />
            Pricing active
          </span>

          <Link
            to="/operator/settings"
            className="btn btn-secondary"
          >
            Manage settings
          </Link>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section className="admin-dashboard-stats">
        <StatCard
          title="Incoming requests"
          value={stats.incoming.length}
          description="Waiting for your action"
          icon="↗"
          detailKey="incoming"
          active={selectedStat === "incoming"}
          onClick={setSelectedStat}
        />

        <StatCard
          title="Shopping"
          value={stats.shopping.length}
          description="Orders being shopped for"
          icon="🛍"
          detailKey="shopping"
          active={selectedStat === "shopping"}
          onClick={setSelectedStat}
        />

        <StatCard
          title="Out for delivery"
          value={stats.delivering.length}
          description="Currently on the road"
          icon="🚴"
          detailKey="delivering"
          active={selectedStat === "delivering"}
          onClick={setSelectedStat}
        />

        <StatCard
          title="Completed"
          value={stats.completed.length}
          description="Successfully delivered"
          icon="✓"
          detailKey="completed"
          active={selectedStat === "completed"}
          onClick={setSelectedStat}
        />

        <StatCard
          title="Customers"
          value={stats.customers}
          description="Customers represented in orders"
          icon="◉"
          detailKey="customers"
          active={selectedStat === "customers"}
          onClick={setSelectedStat}
        />

        <StatCard
          title="Revenue"
          value={`KES ${stats.revenue}`}
          description="From completed orders"
          icon="KSh"
          detailKey="revenue"
          active={selectedStat === "revenue"}
          onClick={setSelectedStat}
        />
      </section>

      {/* =====================================================
          MAIN DASHBOARD
      ===================================================== */}

      <section className="admin-dashboard-main-grid">
        {/* Orders */}
        <div className="admin-dashboard-orders-card">
          <div className="operator-card-header">
            <div>
              <span className="eyebrow">
                {selectedStat === "incoming"
                  ? "NEEDS ATTENTION"
                  : "ORDER QUEUE"}
              </span>

              <h2>
                {selectedStat === "incoming"
                  ? "Incoming requests"
                  : `${formatStatus(
                      selectedStat
                    )} orders`}
              </h2>
            </div>

            <Link
              to="/operator/orders"
              className="card-link"
            >
              View all
            </Link>
          </div>

          {selectedOrders.length === 0 ? (
            <div className="admin-dashboard-empty">
              <div className="empty-icon">
                ✓
              </div>

              <h3>
                Nothing needs attention
              </h3>

              <p>
                Orders matching this dashboard
                category will appear here.
              </p>
            </div>
          ) : (
            <div className="admin-dashboard-order-list">
              {selectedOrders.map((order) => {
                const id = getOrderId(order);

                return (
                  <button
                    type="button"
                    className="admin-dashboard-order"
                    key={id}
                    onClick={() =>
                      setSelectedOrder(order)
                    }
                  >
                    <div className="admin-dashboard-order-main">
                      <div className="admin-dashboard-order-top">
                        <span
                          className={`status-badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {formatStatus(
                            order.status
                          )}
                        </span>

                        <span className="admin-order-number">
                          #{getShortId(order)}
                        </span>
                      </div>

                      <h3>
                        {getCustomerName(order)}
                      </h3>

                      <p>
                        {order.deliveryLocation ||
                          "No delivery location"}
                      </p>
                    </div>

                    <div className="admin-dashboard-order-side">
                      <strong>
                        {order.deliveryFee !=
                        null
                          ? `KES ${order.deliveryFee}`
                          : getOrderAmount(order)
                          ? `KES ${getOrderAmount(
                              order
                            )}`
                          : "—"}
                      </strong>

                      <span>
                        {getItemsCount(order)}{" "}
                        {getItemsCount(order) === 1
                          ? "item"
                          : "items"}
                      </span>

                      <span>→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <aside className="admin-dashboard-side-card">
          <span className="eyebrow">
            QUICK ACTIONS
          </span>

          <h2>Keep things moving.</h2>

          <div className="admin-dashboard-actions">
            <Link
              to="/operator/orders"
              className="admin-dashboard-action"
            >
              <span className="admin-dashboard-action-icon">
                ▣
              </span>

              <span>
                <strong>Manage orders</strong>
                <small>
                  Review and update requests
                </small>
              </span>

              <span>→</span>
            </Link>

            <Link
              to="/operator/settings"
              className="admin-dashboard-action"
            >
              <span className="admin-dashboard-action-icon">
                ⚙
              </span>

              <span>
                <strong>Settings</strong>
                <small>
                  Manage operator settings
                </small>
              </span>

              <span>→</span>
            </Link>

            <Link
              to="/"
              className="admin-dashboard-action"
            >
              <span className="admin-dashboard-action-icon">
                ⌂
              </span>

              <span>
                <strong>Customer app</strong>
                <small>
                  See what customers see
                </small>
              </span>

              <span>→</span>
            </Link>
          </div>

          <div className="admin-dashboard-mini-summary">
            <div>
              <span>Active</span>
              <strong>
                {stats.active.length}
              </strong>
            </div>

            <div>
              <span>Completed</span>
              <strong>
                {stats.completed.length}
              </strong>
            </div>

            <div>
              <span>Cancelled</span>
              <strong>
                {stats.cancelled.length}
              </strong>
            </div>
          </div>
        </aside>
      </section>

      {/* =====================================================
          OPERATIONS SUMMARY
      ===================================================== */}

      <section className="operator-card operator-summary-card">
        <div className="operator-card-header">
          <div>
            <span className="eyebrow">
              TODAY / OPERATIONS
            </span>

            <h2>At a glance</h2>
          </div>
        </div>

        <div className="summary-grid">
          <div>
            <span className="summary-label">
              Incoming
            </span>

            <strong>
              {stats.incoming.length}
            </strong>
          </div>

          <div>
            <span className="summary-label">
              Shopping
            </span>

            <strong>
              {stats.shopping.length}
            </strong>
          </div>

          <div>
            <span className="summary-label">
              Delivering
            </span>

            <strong>
              {stats.delivering.length}
            </strong>
          </div>

          <div>
            <span className="summary-label">
              Completed
            </span>

            <strong>
              {stats.completed.length}
            </strong>
          </div>

          <div>
            <span className="summary-label">
              Revenue
            </span>

            <strong>
              KES {stats.revenue}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          ORDER DETAILS MODAL
      ===================================================== */}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() =>
            setSelectedOrder(null)
          }
          onStatusChange={updateStatus}
          updating={
            updatingId ===
            getOrderId(selectedOrder)
          }
        />
      )}
    </div>
  );
}

