
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const allowedActions = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["SHOPPING", "CANCELLED"],
  SHOPPING: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

const actionLabels = {
  ACCEPTED: "Accept order",
  REJECTED: "Reject request",
  CANCELLED: "Cancel order",
  SHOPPING: "Start shopping",
  OUT_FOR_DELIVERY: "Mark out for delivery",
};

function formatStatus(status = "UNKNOWN") {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  if (status === "COMPLETED") return "completed";
  if (["CANCELLED", "REJECTED"].includes(status)) return "cancelled";
  if (["ACCEPTED", "SHOPPING", "OUT_FOR_DELIVERY"].includes(status)) {
    return "active";
  }
  return "pending";
}

function formatDate(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getShortId(order) {
  const id = order?._id || order?.id;
  return id ? String(id).slice(-6).toUpperCase() : "UNKNOWN";
}

function getCustomerInitial(order) {
  return (order?.customer?.name || "Customer").charAt(0).toUpperCase();
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const data = await api("/api/orders/admin");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(order, status) {
    const id = order._id || order.id;
    if (!id || updatingId) return;

    const permitted = allowedActions[order.status || "PENDING"] || [];
    if (!permitted.includes(status)) {
      setError("That status change is not allowed.");
      return;
    }

    try {
      setUpdatingId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setConfirmAction(null);
      setNotice(`${shortOrder(order)} updated to ${formatStatus(status)}.`);
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to update this order.");
    } finally {
      setUpdatingId("");
    }
  }

  async function confirmPayment(order) {
    const id = order._id || order.id;
    if (!id || updatingId) return;

    try {
      setUpdatingId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}/payment-confirmation`, {
        method: "PATCH",
      });

      setConfirmAction(null);
      setNotice(`Payment confirmed for ${shortOrder(order)}.`);
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to confirm payment.");
    } finally {
      setUpdatingId("");
    }
  }

  function shortOrder(order) {
    return `#${getShortId(order)}`;
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;

    const { order, type, status } = confirmAction;
    if (type === "status") await updateStatus(order, status);
    if (type === "payment") await confirmPayment(order);
  }

  return (
    <div className="page admin-orders-page">
      <div className="admin-page-heading admin-orders-heading">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h1>Customer orders</h1>
          <p>
            Review requests, manage delivery progress, and verify customer payments.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOrders(true)}
          disabled={refreshing || Boolean(updatingId)}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="admin-order-summary-strip">
        <div>
          <span>Incoming</span>
          <strong>
            {orders.filter((order) => order.status === "PENDING").length}
          </strong>
        </div>
        <div>
          <span>In progress</span>
          <strong>
            {
              orders.filter((order) =>
                ["ACCEPTED", "SHOPPING", "OUT_FOR_DELIVERY"].includes(order.status)
              ).length
            }
          </strong>
        </div>
        <div>
          <span>Payments to verify</span>
          <strong>
            {
              orders.filter(
                (order) =>
                  order.status === "OUT_FOR_DELIVERY" &&
                  order.paymentStatus === "CUSTOMER_MARKED_PAID"
              ).length
            }
          </strong>
        </div>
      </div>

      {error && (
        <div className="nitume-feedback nitume-feedback-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="nitume-feedback nitume-feedback-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">
            ×
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
          <p>Customer requests will appear here when they are submitted.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const id = order._id || order.id;
            const currentStatus = order.status || "PENDING";
            const customer = order.customer || {};
            const actions = allowedActions[currentStatus] || [];
            const isUpdating = updatingId === id;
            const paymentStatus = order.paymentStatus || "UNPAID";
            const paymentNeedsConfirmation =
              currentStatus === "OUT_FOR_DELIVERY" &&
              paymentStatus === "CUSTOMER_MARKED_PAID";

            return (
              <article className="admin-order-card" key={id}>
                <div className="admin-order-top">
                  <div>
                    <span className="order-label">ORDER</span>
                    <h2>#{getShortId(order)}</h2>
                    <small>{formatDate(order.createdAt)}</small>
                  </div>
                  <span className={`admin-status ${getStatusClass(currentStatus)}`}>
                    {formatStatus(currentStatus)}
                  </span>
                </div>

                <div className="admin-customer">
                  <div className="customer-avatar">
                    {getCustomerInitial(order)}
                  </div>
                  <div>
                    <strong>{customer.name || "Customer"}</strong>
                    {customer.phone && <p>{customer.phone}</p>}
                    {customer.email && <span>{customer.email}</span>}
                  </div>
                </div>

                <div className="admin-order-info-grid">
                  <div>
                    <span>ITEMS</span>
                    <p>{order.items || "No items provided"}</p>
                  </div>
                  <div>
                    <span>PICKUP / SHOP</span>
                    <p>{order.pickupLocation || "Not provided"}</p>
                  </div>
                  <div>
                    <span>DELIVERY LOCATION</span>
                    <p>{order.deliveryLocation || "Not provided"}</p>
                  </div>
                  <div>
                    <span>DELIVERY FEE</span>
                    <p>
                      {order.deliveryFee != null
                        ? `KES ${Number(order.deliveryFee).toLocaleString("en-KE")}`
                        : "Not available"}
                    </p>
                  </div>
                </div>

                {order.notes && (
                  <div className="admin-order-notes">
                    <span>CUSTOMER NOTES</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                <div className="admin-payment-panel">
                  <div>
                    <span className="order-meta-label">PAYMENT STATUS</span>
                    <strong>{formatStatus(paymentStatus)}</strong>
                  </div>

                  {paymentNeedsConfirmation ? (
                    <div className="admin-payment-action">
                      <p>
                        Customer says they have paid. Verify receipt before confirming.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={Boolean(updatingId)}
                        onClick={() =>
                          setConfirmAction({ type: "payment", order })
                        }
                      >
                        {isUpdating ? "Confirming..." : "Confirm payment"}
                      </button>
                    </div>
                  ) : paymentStatus === "CONFIRMED" ? (
                    <span className="admin-payment-confirmed">
                      ✓ Payment confirmed
                    </span>
                  ) : (
                    <p className="updating-text">
                      Waiting for the customer to submit payment.
                    </p>
                  )}
                </div>

                <div className="admin-order-actions">
                  <div className="admin-order-actions-header">
                    <strong>
                      {currentStatus === "PENDING"
                        ? "Review this request"
                        : "Delivery progress"}
                    </strong>
                    {isUpdating && (
                      <span className="updating-text">Updating...</span>
                    )}
                  </div>

                  {actions.length > 0 ? (
                    <div className="status-actions">
                      {actions.map((status) => (
                        <button
                          type="button"
                          key={status}
                          className={`status-action ${
                            ["REJECTED", "CANCELLED"].includes(status)
                              ? "danger"
                              : status === "ACCEPTED"
                                ? "selected"
                                : ""
                          }`}
                          disabled={Boolean(updatingId)}
                          onClick={() =>
                            setConfirmAction({ type: "status", order, status })
                          }
                        >
                          {actionLabels[status] || formatStatus(status)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="updating-text">
                      {currentStatus === "COMPLETED"
                        ? "The customer has completed this order."
                        : `This order is ${formatStatus(currentStatus).toLowerCase()}. No further status changes are available.`}
                    </p>
                  )}

                  {currentStatus === "OUT_FOR_DELIVERY" && (
                    <p className="updating-text">
                      The customer completes the order after payment has been confirmed.
                    </p>
                  )}
                </div>

                <div className="admin-order-footer">
                  <Link to={`/operator/orders/${id}`} className="order-details-link">
                    View full order <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {confirmAction && (
        <div
          className="nitume-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingId) {
              setConfirmAction(null);
            }
          }}
        >
          <section
            className="nitume-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-confirm-title"
          >
            <div className="nitume-modal-icon">
              {confirmAction.type === "payment" ? "✓" : "!"}
            </div>

            <h2 id="admin-order-confirm-title">
              {confirmAction.type === "payment"
                ? "Confirm payment received?"
                : `${actionLabels[confirmAction.status] || "Update order"}?`}
            </h2>

            <p>
              {confirmAction.type === "payment"
                ? "Confirm only after you have independently verified that the payment was received."
                : `You are about to change ${shortOrder(confirmAction.order)} to ${formatStatus(confirmAction.status)}.`}
            </p>

            <div className="order-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmAction(null)}
                disabled={Boolean(updatingId)}
              >
                Go back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runConfirmedAction}
                disabled={Boolean(updatingId)}
              >
                {updatingId
                  ? "Please wait..."
                  : confirmAction.type === "payment"
                    ? "Confirm payment"
                    : "Confirm change"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
