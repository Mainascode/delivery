import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "./services/api";

function formatStatus(status) {
  if (!status) return "Pending";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("deliver") ||
    value.includes("complete") ||
    value.includes("paid")
  ) {
    return "status-badge status-success";
  }

  if (
    value.includes("cancel") ||
    value.includes("reject") ||
    value.includes("closed")
  ) {
    return "status-badge status-danger";
  }

  if (
    value.includes("progress") ||
    value.includes("accepted") ||
    value.includes("confirmed")
  ) {
    return "status-badge status-active";
  }

  return "status-badge";
}

function shortId(id) {
  if (!id) return "ORDER";

  return `#${String(id).slice(-6).toUpperCase()}`;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await api("/api/orders");

      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);

      setError(
        err.message || "Unable to load your orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <div className="eyebrow">YOUR ACTIVITY</div>

            <h1>My orders</h1>

            <p className="page-description">
              Loading your requests and deliveries...
            </p>
          </div>
        </div>

        <div className="loading-card">
          <span className="spinner" />

          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page orders-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">YOUR ACTIVITY</div>

          <h1>My orders</h1>

          <p className="page-description">
            View your requests, delivery locations and current
            order status.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOrders(true)}
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
            onClick={() => loadOrders()}
          >
            Try again
          </button>
        </div>
      )}

      {orders.length === 0 && !error ? (
        <div className="empty-card">
          <div className="empty-icon">+</div>

          <h2>No orders yet</h2>

          <p>
            Your requests will appear here once you create your
            first delivery request.
          </p>

          <Link
            to="/request"
            className="btn btn-primary"
          >
            Request a delivery
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const orderId = order._id || order.id;

            return (
              <Link
                key={orderId}
                to={`/orders/${orderId}`}
                className="order-card"
              >
                <div className="order-card-top">
                  <div>
                    <div className="order-id">
                      {shortId(orderId)}
                    </div>

                    <div className="order-date">
                      {order.createdAt
                        ? new Date(
                            order.createdAt
                          ).toLocaleDateString(
                            "en-KE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Recent request"}
                    </div>
                  </div>

                  <span
                    className={getStatusClass(
                      order.status
                    )}
                  >
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="order-meta">
                  <div>
                    <span className="order-meta-label">
                      DELIVERY LOCATION
                    </span>

                    <strong>
                      {order.deliveryLocation ||
                        "Not provided"}
                    </strong>
                  </div>

                  {order.pickupLocation && (
                    <div>
                      <span className="order-meta-label">
                        PICKUP / SHOP
                      </span>

                      <strong>
                        {order.pickupLocation}
                      </strong>
                    </div>
                  )}

                  {order.items && (
                    <div>
                      <span className="order-meta-label">
                        ITEMS
                      </span>

                      <strong>
                        {order.items}
                      </strong>
                    </div>
                  )}
                </div>

                <div className="order-card-bottom">
                  <div>
                    <span className="order-meta-label">
                      DELIVERY FEE
                    </span>

                    <strong className="order-fee">
                      KES {order.deliveryFee ?? "—"}
                    </strong>
                  </div>

                  <span className="text-link">
                    View details →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
