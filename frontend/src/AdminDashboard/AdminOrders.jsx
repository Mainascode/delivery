import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const allowedActions = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["SHOPPING", "CANCELLED"],
  SHOPPING: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

const actionLabels = {
  ACCEPTED: "Accept order",
  REJECTED: "Reject request",
  CANCELLED: "Cancel order",
  SHOPPING: "Start shopping",
  READY_FOR_DELIVERY: "Mark ready for delivery",
};

function formatStatus(status = "UNKNOWN") {
  return status.replaceAll("_", " ").toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
  if (status === "COMPLETED") return "completed";
  if (["CANCELLED", "REJECTED"].includes(status)) return "cancelled";
  if (["ACCEPTED", "SHOPPING", "READY_FOR_DELIVERY"].includes(status)) return "active";
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

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `KES ${amount.toLocaleString("en-KE")}`
    : "Not available";
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
  const [shoppingCosts, setShoppingCosts] = useState({});

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const data = await api("/api/orders/admin");
      const latestOrders = data.orders || [];
      setOrders(latestOrders);

      setShoppingCosts((current) => {
        const next = { ...current };
        latestOrders.forEach((order) => {
          const id = order._id || order.id;
          if (id && next[id] === undefined && order.shoppingCost != null) {
            next[id] = String(order.shoppingCost);
          }
        });
        return next;
      });
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

  function shortOrder(order) {
    return `#${getShortId(order)}`;
  }

  async function saveShoppingCost(order) {
    const id = order._id || order.id;
    const rawValue = shoppingCosts[id];

    if (!id || updatingId) return;

    if (rawValue === undefined || String(rawValue).trim() === "") {
      setError("Enter the actual shopping cost first.");
      return;
    }

    const shoppingCost = Number(rawValue);
    if (!Number.isSafeInteger(shoppingCost) || shoppingCost < 0) {
      setError("Shopping cost must be a whole number of KES (zero or more).");
      return;
    }

    try {
      setUpdatingId(id);
      setError("");
      setNotice("");

      const data = await api(`/api/orders/${id}/shopping-cost`, {
        method: "PATCH",
        body: JSON.stringify({ shoppingCost }),
      });

      setNotice(
        `Shopping cost saved for ${shortOrder(order)}. Total: ${money(
          data.totalAmount ?? shoppingCost + Number(order.deliveryFee || 0)
        )}.`
      );
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to save shopping cost.");
    } finally {
      setUpdatingId("");
    }
  }

  async function updateStatus(order, status) {
    const id = order._id || order.id;
    if (!id || updatingId) return;

    const permitted = allowedActions[order.status || "PENDING"] || [];
    if (!permitted.includes(status)) {
      setError("That status change is not allowed.");
      return;
    }

    if (status === "READY_FOR_DELIVERY") {
      const shoppingCost = Number(order.shoppingCost);
      const deliveryFee = Number(order.deliveryFee);
      const totalAmount = Number(order.totalAmount);

      if (
        !Number.isSafeInteger(shoppingCost) ||
        shoppingCost < 0 ||
        !Number.isSafeInteger(deliveryFee) ||
        deliveryFee < 0 ||
        !Number.isSafeInteger(totalAmount) ||
        totalAmount !== shoppingCost + deliveryFee
      ) {
        setError("Save a valid shopping cost before marking this order ready.");
        return;
      }

      if (order.paymentStatus !== "UNPAID") {
        setError("This order's payment state does not allow this status change.");
        return;
      }
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

  async function runConfirmedAction() {
    if (!confirmAction) return;
    const { order, status } = confirmAction;
    await updateStatus(order, status);
  }

  return (
    <div className="page admin-orders-page">
      <div className="admin-page-heading admin-orders-heading">
        <div>
          <span className="eyebrow">OPERATIONS</span>
          <h1>Customer orders</h1>
          <p>
            Review requests, manage shopping, set the final amount, and track verified payments.
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
          <strong>{orders.filter((order) => order.status === "PENDING").length}</strong>
        </div>
        <div>
          <span>In progress</span>
          <strong>
            {
              orders.filter((order) =>
                ["ACCEPTED", "SHOPPING", "READY_FOR_DELIVERY"].includes(order.status)
              ).length
            }
          </strong>
        </div>
        <div>
          <span>Awaiting M-Pesa</span>
          <strong>
            {
              orders.filter(
                (order) =>
                  order.status === "READY_FOR_DELIVERY" &&
                  order.paymentStatus !== "CONFIRMED"
              ).length
            }
          </strong>
        </div>
      </div>

      {error && (
        <div className="nitume-feedback nitume-feedback-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {notice && (
        <div className="nitume-feedback nitume-feedback-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
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
                        const paymentStatus =
              orderPayment?.payment?.status === "SUCCESS" ||
              orderPayment?.paymentStatus === "CONFIRMED"
                ? "CONFIRMED"
                : orderPayment?.payment?.status ||
                  orderPayment?.paymentStatus ||
                  order.paymentStatus ||
                  "UNPAID";
            const shoppingCost = Number(order.shoppingCost);
            const deliveryFee = Number(order.deliveryFee);
            const totalAmount = Number(order.totalAmount);
            const validSavedTotal =
              Number.isSafeInteger(shoppingCost) &&
              shoppingCost >= 0 &&
              Number.isSafeInteger(deliveryFee) &&
              deliveryFee >= 0 &&
              Number.isSafeInteger(totalAmount) &&
              totalAmount === shoppingCost + deliveryFee;

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
                  <div className="customer-avatar">{getCustomerInitial(order)}</div>
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
                    <p>{money(order.deliveryFee)}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="admin-order-notes">
                    <span>CUSTOMER NOTES</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                {currentStatus === "SHOPPING" && (
                  <div className="admin-payment-panel">
                    <span className="order-meta-label">FINAL SHOPPING COST</span>
                    <p className="updating-text">
                      Enter what you actually spent buying the customer's items.
                    </p>
                    <label>
                      Shopping cost (KES)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={
                          shoppingCosts[id] ??
                          (order.shoppingCost != null ? String(order.shoppingCost) : "")
                        }
                        onChange={(event) =>
                          setShoppingCosts((current) => ({
                            ...current,
                            [id]: event.target.value,
                          }))
                        }
                        placeholder="e.g. 850"
                        disabled={Boolean(updatingId)}
                      />
                    </label>
                    <div className="customer-order-detail">
                      <span>Delivery fee</span>
                      <strong>{money(order.deliveryFee)}</strong>
                    </div>
                    <div className="customer-order-detail">
                      <span><strong>Total customer payment</strong></span>
                      <strong>
                        {shoppingCosts[id] !== undefined &&
                        shoppingCosts[id].trim() !== "" &&
                        Number.isSafeInteger(Number(shoppingCosts[id])) &&
                        Number(shoppingCosts[id]) >= 0
                          ? money(Number(shoppingCosts[id]) + Number(order.deliveryFee || 0))
                          : order.totalAmount != null
                            ? money(order.totalAmount)
                            : "Save shopping cost to calculate"}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => saveShoppingCost(order)}
                      disabled={Boolean(updatingId)}
                    >
                      {isUpdating ? "Saving..." : "Save shopping cost"}
                    </button>
                    {order.shoppingCost != null && (
                      <p className="updating-text">
                        Saved shopping cost: {money(order.shoppingCost)}
                      </p>
                    )}
                  </div>
                )}

                <div className="admin-payment-panel">
                  <div>
                    <span className="order-meta-label">M-PESA PAYMENT STATUS</span>
                    <strong>{formatStatus(paymentStatus)}</strong>
                  </div>
                  {paymentStatus === "CONFIRMED" ? (
                    <span className="admin-payment-confirmed">
                      ✓ Payment verified by Safaricom callback
                    </span>
                  ) : currentStatus === "READY_FOR_DELIVERY" ? (
                    <p className="updating-text">
                      Waiting for the customer's M-Pesa payment to be verified.
                    </p>
                  ) : (
                    <p className="updating-text">
                      Payment becomes available after shopping cost is saved and the order is ready.
                    </p>
                  )}
                  {order.mpesaReceiptNumber && (
                    <p className="updating-text">
                      M-Pesa receipt: <strong>{order.mpesaReceiptNumber}</strong>
                    </p>
                  )}
                  {paymentStatus === "REVIEW_REQUIRED" && (
                    <p className="updating-text">
                      Payment requires reconciliation. Do not ask the customer to pay again.
                    </p>
                  )}
                </div>

                <div className="admin-order-actions">
                  <div className="admin-order-actions-header">
                    <strong>
                      {currentStatus === "PENDING" ? "Review this request" : "Delivery progress"}
                    </strong>
                    {isUpdating && <span className="updating-text">Updating...</span>}
                  </div>

                  {actions.length > 0 ? (
                    <div className="status-actions">
                      {actions.map((status) => {
                        const readyBlocked =
                          status === "READY_FOR_DELIVERY" &&
                          (
                            !validSavedTotal ||
                            paymentStatus !== "UNPAID" ||
                            order.paymentRequestInProgress === true
                          );

                        return (
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
                            disabled={Boolean(updatingId) || readyBlocked}
                            title={
                              readyBlocked
                                ? "Save a valid shopping cost and ensure payment has not started."
                                : undefined
                            }
                            onClick={() => setConfirmAction({ type: "status", order, status })}
                          >
                            {actionLabels[status] || formatStatus(status)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="updating-text">
                      {currentStatus === "COMPLETED"
                        ? "The customer has completed this order."
                        : `This order is ${formatStatus(currentStatus).toLowerCase()}. No further status changes are available.`}
                    </p>
                  )}

                  {currentStatus === "READY_FOR_DELIVERY" && (
                    <p className="updating-text">
                      The customer completes the order after M-Pesa payment is verified.
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
            <div className="nitume-modal-icon">!</div>
            <h2 id="admin-order-confirm-title">
              {actionLabels[confirmAction.status] || "Update order"}?
            </h2>
            <p>
              You are about to change {shortOrder(confirmAction.order)} to{" "}
              {formatStatus(confirmAction.status)}.
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
                {updatingId ? "Please wait..." : "Confirm change"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}