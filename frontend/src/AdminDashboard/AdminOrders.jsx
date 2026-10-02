import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const statuses = [
  "PENDING",
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
    case "PENDING":
      return "pending";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "ACCEPTED":
    case "SHOPPING":
    case "OUT_FOR_DELIVERY":
      return "active";
    default:
      return "";
  }
}

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
      setError(err.message || "Unable to load orders.");
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
      setError(err.message || "Unable to update order status.");
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
            Review customer requests and move each delivery through its
            current stage.
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
          <button type="button" onClick={() => loadOrders()}>
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
          <div>📦</div>
          <h2>No orders yet</h2>
          <p>
            Customer requests will appear here when they are submitted.
          </p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const id = order._id || order.id;
            const shortId = id
              ? id.slice(-6).toUpperCase()
              : "UNKNOWN";

            const customer = order.customer;

            return (
              <article className="admin-order-card" key={id}>
                <div className="admin-order-top">
                  <div>
                    <span className="order-label">ORDER</span>
                    <h2>#{shortId}</h2>
                    <small>{formatDate(order.createdAt)}</small>
                  </div>

                  <span
                    className={`admin-status ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="admin-customer">
                  <div className="customer-avatar">
                    {(customer?.name || "C").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <strong>
                      {customer?.name || "Customer"}
                    </strong>
                    <span>
                      {customer?.email || "No email provided"}
                    </span>
                    {customer?.phone && (
                      <span>{customer.phone}</span>
                    )}
                  </div>
                </div>

                <div className="admin-order-info-grid">
                  <div>
                    <span>ITEMS</span>
                    <p>{order.items || "No items provided"}</p>
                  </div>

                  <div>
                    <span>DELIVERY LOCATION</span>
                    <p>
                      {order.deliveryLocation ||
                        "No delivery location provided"}
                    </p>
                  </div>

                  {order.pickupLocation && (
                    <div>
                      <span>PICKUP / SHOP</span>
                      <p>{order.pickupLocation}</p>
                    </div>
                  )}

                  <div>
                    <span>DELIVERY FEE</span>
                    <p>
                      {order.deliveryFee != null
                        ? `KES ${order.deliveryFee}`
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="admin-order-notes">
                    <span>NOTES</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                <div className="admin-order-actions">
                  <div className="admin-order-actions-header">
                    <strong>Update status</strong>

                    {updatingId?.startsWith(`${id}-`) && (
                      <span>Updating...</span>
                    )}
                  </div>

                  <div className="status-actions">
                    {statuses.map((status) => {
                      const isCurrent = order.status === status;
                      const isUpdating =
                        updatingId === `${id}-${status}`;

                      return (
                        <button
                          type="button"
                          key={status}
                          className={`status-action ${
                            isCurrent ? "selected" : ""
                          }`}
                          disabled={
                            updatingId?.startsWith(`${id}-`)
                          }
                          onClick={() =>
                            updateStatus(id, status)
                          }
                        >
                          {isUpdating
                            ? "Updating..."
                            : formatStatus(status)}
                        </button>
                      );
                    })}
                  </div>
                </div>

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