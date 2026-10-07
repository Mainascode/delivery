import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const statuses = [
  "ACCEPTED",
  "SHOPPING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

function formatStatus(status) {
  return (
    status
      ?.replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    "Unknown"
  );
}

function getStatusClass(status) {
  switch (status) {
    case "COMPLETED":
      return "completed";

    case "CANCELLED":
      return "cancelled";

    case "ACCEPTED":
    case "SHOPPING":
    case "OUT_FOR_DELIVERY":
      return "active";

    default:
      return "pending";
  }
}

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getShortId(order) {
  const id = order?._id || order?.id;

  return id ? id.slice(-6).toUpperCase() : "UNKNOWN";
}

function getCustomerInitial(order) {
  return (order?.customer?.name || "Customer")
    .charAt(0)
    .toUpperCase();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await api("/api/orders/admin");

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to load admin orders:", err);

      setError(
        err.message || "Unable to load customer orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(id, status) {
    try {
      setUpdatingId(`${id}-${status}`);
      setError("");

      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await loadOrders(true);
    } catch (err) {
      console.error("Failed to update order:", err);

      setError(
        err.message || "Unable to update order status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="page operator-orders-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">NITUME / OPERATOR</span>

          <h1>Orders</h1>

          <p>
            Review customer requests and manage each delivery from
            acceptance to completion.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => loadOrders()}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📦</div>

          <h2>No orders yet</h2>

          <p>
            Customer requests will appear here when they are
            submitted.
          </p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const id = order._id || order.id;

            const currentStatus =
              order.status || "ACCEPTED";

            const customer = order.customer;

            const isUpdating =
              updatingId?.startsWith(`${id}-`);

            return (
              <article
                className="admin-order-card"
                key={id}
              >
                {/* ORDER HEADER */}
                <div className="admin-order-top">
                  <div>
                    <span className="order-label">
                      ORDER
                    </span>

                    <h2>#{getShortId(order)}</h2>

                    <small>
                      {formatDate(order.createdAt)}
                    </small>
                  </div>

                  <span
                    className={`admin-status ${getStatusClass(
                      currentStatus
                    )}`}
                  >
                    {formatStatus(currentStatus)}
                  </span>
                </div>

                {/* CUSTOMER */}
                <div className="admin-customer">
                  <div className="customer-avatar">
                    {getCustomerInitial(order)}
                  </div>

                  <div>
                    <strong>
                      {customer?.name || "Customer"}
                    </strong>

                    <span>
                      {customer?.email ||
                        "No email provided"}
                    </span>

                    {customer?.phone && (
                      <span>{customer.phone}</span>
                    )}
                  </div>
                </div>

                {/* ORDER INFORMATION */}
                <div className="admin-order-info-grid">
                  <div>
                    <span>ITEMS</span>

                    <p>
                      {order.items ||
                        "No items provided"}
                    </p>
                  </div>

                  <div>
                    <span>PICKUP / SHOP</span>

                    <p>
                      {order.pickupLocation ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <span>DELIVERY LOCATION</span>

                    <p>
                      {order.deliveryLocation ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <span>DELIVERY FEE</span>

                    <p>
                      {order.deliveryFee != null
                        ? `KES ${order.deliveryFee}`
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {/* NOTES */}
                {order.notes && (
                  <div className="admin-order-notes">
                    <span>CUSTOMER NOTES</span>

                    <p>{order.notes}</p>
                  </div>
                )}

                {/* STATUS */}
                <div className="admin-order-actions">
                  <div className="admin-order-actions-header">
                    <strong>Order status</strong>

                    {isUpdating && (
                      <span className="updating-text">
                        Updating...
                      </span>
                    )}
                  </div>

                  <div className="status-actions">
                    {statuses.map((status) => {
                      const isCurrent =
                        currentStatus === status;

                      const isUpdatingThis =
                        updatingId === `${id}-${status}`;

                      return (
                        <button
                          type="button"
                          key={status}
                          className={`status-action ${
                            isCurrent ? "selected" : ""
                          }`}
                          disabled={isUpdating}
                          onClick={() =>
                            updateStatus(id, status)
                          }
                        >
                          {isUpdatingThis
                            ? "Updating..."
                            : formatStatus(status)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="admin-order-footer">
                  <Link
                    to={`/operator/orders/${id}`}
                    className="order-details-link"
                  >
                    View full order →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}