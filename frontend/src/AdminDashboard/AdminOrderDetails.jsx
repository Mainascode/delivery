import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

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
  if (status === "REJECTED" || status === "CANCELLED") return "cancelled";
  if (status === "COMPLETED") return "completed";
  if (status === "PENDING") return "pending";
  return "active";
}

function formatDate(value) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api(`/api/orders/admin/${id}`);
        setOrder(data.order);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError(err.message || "Unable to load order.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <div className="admin-loading">
          <div className="spinner" />
          <p>Loading order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page">
        <div className="admin-empty">
          <div>⚠</div>
          <h2>Order unavailable</h2>
          <p>{error || "This order could not be found."}</p>
          <Link
            to="/operator/orders"
            className="btn btn-primary"
          >
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const customer = order.customer;
  const shortId = order._id
    ? order._id.slice(-6).toUpperCase()
    : "UNKNOWN";

  return (
    <div className="page admin-order-details-page">
      <div className="admin-page-heading">
        <div>
          <Link
            to="/operator/orders"
            className="admin-back-link"
          >
            ← Back to orders
          </Link>

          <span className="eyebrow">ORDER DETAILS</span>
          <h1>#{shortId}</h1>
          <p>
            Created {formatDate(order.createdAt)}
          </p>
        </div>

        <span className={`admin-status ${getStatusClass(order.status)}`}>
          {formatStatus(order.status)}
        </span>
      </div>

      <div className="order-details-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">CUSTOMER</span>
              <h2>Customer information</h2>
            </div>
          </div>

          <div className="detail-customer">
            <div className="customer-avatar large">
              {(customer?.name || "C")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {customer?.name || "Customer"}
              </strong>

              <span>
                {customer?.email || "No email"}
              </span>

              <span>
                {customer?.phone || "No phone number"}
              </span>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">DELIVERY</span>
              <h2>Order information</h2>
            </div>
          </div>

          <div className="detail-list">
            <div>
              <span>Status</span>
              <strong>{formatStatus(order.status)}</strong>
            </div>

            <div>
              <span>Delivery fee</span>
              <strong>
                {order.deliveryFee != null
                  ? `KES ${order.deliveryFee}`
                  : "Not available"}
              </strong>
            </div>

            <div>
              <span>Pricing mode</span>
              <strong>
                {order.pricingMode || "NORMAL"}
              </strong>
            </div>
          </div>
        </section>

        <section className="admin-panel detail-wide">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">SHOPPING REQUEST</span>
              <h2>Items</h2>
            </div>
          </div>

          <div className="detail-text">
            {order.items || "No items provided."}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">PICKUP</span>
              <h2>Shop / collection</h2>
            </div>
          </div>

          <div className="detail-text">
            {order.pickupLocation || "Not provided."}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">DELIVERY</span>
              <h2>Destination</h2>
            </div>
          </div>

          <div className="detail-text">
            {order.deliveryLocation || "Not provided."}
          </div>
        </section>

        {order.notes && (
          <section className="admin-panel detail-wide">
            <div className="admin-panel-heading">
              <div>
                <span className="eyebrow">CUSTOMER NOTES</span>
                <h2>Additional instructions</h2>
              </div>
            </div>

            <div className="detail-text">
              {order.notes}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
