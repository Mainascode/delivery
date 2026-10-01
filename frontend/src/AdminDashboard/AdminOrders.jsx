import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

const statuses = [
  "ACCEPTED",
  "SHOPPING",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

function formatStatus(status) {
  return status
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  switch (status) {
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

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
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
    load();
  }, [load]);

  async function updateStatus(id, status) {
    try {
      setUpdatingId(`${id}-${status}`);
      setError("");

      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await load(true);
    } catch (err) {
      console.error("Failed to update order:", err);
      setError(err.message || "Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="page operator-orders-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">NITUME / OPERATOR</div>
          <h1>Orders</h1>
          <p className="page-description">
            Review customer requests and move each delivery through its
            current stage.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => load(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>

          <button
            type="button"
            className="alert-action"
            onClick={() => load()}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <div className="spinner" />
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">📦</div>
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

            const isUpdatingThisOrder = updatingId?.startsWith(`${id}-`);

            return (
              <article className="admin-order-card" key={id}>
                <div className="admin-order-header">
                  <div>
                    <span className="eyebrow">ORDER</span>

                    <h2>#{shortId}</h2>
                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      order.status
                    )}`}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="admin-order-content">
                  <div className="admin-order-section">
                    <span className="order-meta-label">ITEMS</span>
                    <p>{order.items || "No items provided"}</p>
                  </div>

                  <div className="admin-order-section">
                    <span className="order-meta-label">
                      DELIVERY LOCATION
                    </span>
                    <p>
                      {order.deliveryLocation ||
                        "No delivery location provided"}
                    </p>
                  </div>

                  {order.pickupLocation && (
                    <div className="admin-order-section">
                      <span className="order-meta-label">
                        PICKUP LOCATION
                      </span>
                      <p>{order.pickupLocation}</p>
                    </div>
                  )}

                  {order.notes && (
                    <div className="admin-order-section">
                      <span className="order-meta-label">NOTES</span>
                      <p>{order.notes}</p>
                    </div>
                  )}
                </div>

                <div className="admin-order-actions">
                  <div className="admin-order-actions-heading">
                    <span>Update status</span>

                    {isUpdatingThisOrder && (
                      <span className="updating-text">
                        Updating...
                      </span>
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
                          disabled={isUpdatingThisOrder}
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
                    View order details →
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