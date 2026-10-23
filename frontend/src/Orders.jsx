
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./services/api";

const ACTIVE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "SHOPPING",
  "OUT_FOR_DELIVERY",
];

function formatStatus(status = "PENDING") {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  if (["COMPLETED", "CONFIRMED"].includes(status)) {
    return "status-badge status-success";
  }
  if (["CANCELLED", "REJECTED"].includes(status)) {
    return "status-badge status-danger";
  }
  if (ACTIVE_STATUSES.includes(status)) {
    return "status-badge status-active";
  }
  return "status-badge";
}

function shortId(id) {
  return id ? `#${String(id).slice(-6).toUpperCase()}` : "#ORDER";
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({
    items: "",
    pickupLocation: "",
    deliveryLocation: "",
    notes: "",
  });
  const [confirmAction, setConfirmAction] = useState(null);

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const data = await api("/api/orders");
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(getErrorMessage(err, "Unable to load your orders."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  function startEditing(order) {
    setNotice("");
    setError("");
    setEditingId(order._id);
    setEditForm({
      items: order.items || "",
      pickupLocation: order.pickupLocation || "",
      deliveryLocation: order.deliveryLocation || "",
      notes: order.notes || "",
    });
  }

  function stopEditing() {
    setEditingId("");
    setEditForm({
      items: "",
      pickupLocation: "",
      deliveryLocation: "",
      notes: "",
    });
  }

  async function saveEdit(order) {
    const id = order._id || order.id;
    if (!editForm.items.trim() || !editForm.deliveryLocation.trim()) {
      setError("Items and delivery location are required.");
      return;
    }

    try {
      setBusyId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          items: editForm.items.trim(),
          pickupLocation: editForm.pickupLocation.trim(),
          deliveryLocation: editForm.deliveryLocation.trim(),
          notes: editForm.notes.trim(),
        }),
      });

      stopEditing();
      setNotice("Your order details have been updated.");
      await loadOrders(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update this order."));
    } finally {
      setBusyId("");
    }
  }

  async function cancelOrder(order) {
    const id = order._id || order.id;
    try {
      setBusyId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}/cancel`, {
        method: "POST",
      });

      setConfirmAction(null);
      setNotice(`${shortId(id)} has been cancelled.`);
      await loadOrders(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to cancel this order."));
    } finally {
      setBusyId("");
    }
  }

  async function submitPayment(order) {
    const id = order._id || order.id;
    try {
      setBusyId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}/payment-submitted`, {
        method: "PATCH",
      });

      setNotice("Payment submitted. Please wait for admin confirmation.");
      await loadOrders(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to submit payment."));
    } finally {
      setBusyId("");
    }
  }

  async function completeOrder(order) {
    const id = order._id || order.id;
    try {
      setBusyId(id);
      setError("");
      setNotice("");

      await api(`/api/orders/${id}/complete`, {
        method: "PATCH",
      });

      setConfirmAction(null);
      setNotice("Order completed. Thanks for using NITUME!");
      await loadOrders(true);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to complete this order."));
    } finally {
      setBusyId("");
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;

    const { type, order } = confirmAction;
    if (type === "cancel") await cancelOrder(order);
    if (type === "complete") await completeOrder(order);
  }

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
      <div className="page-header orders-heading">
        <div>
          <div className="eyebrow">YOUR ACTIVITY</div>
          <h1>My orders</h1>
          <p className="page-description">
            Track your requests, update pending orders, and confirm delivery.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => loadOrders(true)}
          disabled={refreshing || Boolean(busyId)}
        >
          {refreshing ? "Refreshing..." : "↻ Refresh"}
        </button>
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

      {orders.length === 0 ? (
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <h2>Your next errand starts here</h2>
          <p>You don’t have any orders to display yet.</p>
          <Link to="/request" className="btn btn-primary">
            Create a request <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const id = order._id || order.id;
            const status = order.status || "PENDING";
            const paymentStatus = order.paymentStatus || "UNPAID";
            const pending = status === "PENDING";
            const busy = busyId === id;
            const editing = editingId === id;
            const canSubmitPayment =
              status === "OUT_FOR_DELIVERY" && paymentStatus === "UNPAID";
            const canComplete =
              status === "OUT_FOR_DELIVERY" && paymentStatus === "CONFIRMED";

            return (
              <article className="order-card customer-order-card" key={id}>
                <div className="order-card-top">
                  <div>
                    <span className="order-meta-label">ORDER REFERENCE</span>
                    <h2>{shortId(id)}</h2>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={statusClass(status)}>
                    {formatStatus(status)}
                  </span>
                </div>

                <div className="customer-order-details">
                  <div className="customer-order-detail">
                    <span className="order-meta-label">ITEMS</span>
                    <strong>{order.items || "No items provided"}</strong>
                  </div>
                  <div className="customer-order-detail">
                    <span className="order-meta-label">PICKUP / SHOP</span>
                    <strong>{order.pickupLocation || "Not provided"}</strong>
                  </div>
                  <div className="customer-order-detail">
                    <span className="order-meta-label">DELIVER TO</span>
                    <strong>{order.deliveryLocation || "Not provided"}</strong>
                  </div>
                  <div className="customer-order-detail">
                    <span className="order-meta-label">DELIVERY FEE</span>
                    <strong className="order-fee">
                      {order.deliveryFee != null
                        ? `KES ${Number(order.deliveryFee).toLocaleString("en-KE")}`
                        : "Not available"}
                    </strong>
                  </div>
                </div>

                {order.notes && (
                  <div className="customer-order-notes">
                    <span className="order-meta-label">YOUR NOTES</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                <div className="customer-payment-panel">
                  <div>
                    <span className="order-meta-label">PAYMENT STATUS</span>
                    <strong>{formatStatus(paymentStatus)}</strong>
                  </div>
                  {paymentStatus === "CUSTOMER_MARKED_PAID" && (
                    <p className="customer-order-hint">
                      Your payment report is waiting for admin confirmation.
                    </p>
                  )}
                  {paymentStatus === "CONFIRMED" && status === "OUT_FOR_DELIVERY" && (
                    <p className="customer-order-hint">
                      Payment confirmed. You can now complete this order.
                    </p>
                  )}
                </div>

                {editing && pending && (
                  <form
                    className="order-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveEdit(order);
                    }}
                  >
                    <div className="order-edit-heading">
                      <h3>Edit your request</h3>
                      <p>Changes are available only before the order is accepted.</p>
                    </div>

                    <label>
                      Items / shopping list
                      <textarea
                        rows={3}
                        value={editForm.items}
                        onChange={(event) =>
                          setEditForm({ ...editForm, items: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Pickup / shop location
                      <input
                        value={editForm.pickupLocation}
                        onChange={(event) =>
                          setEditForm({ ...editForm, pickupLocation: event.target.value })
                        }
                      />
                    </label>

                    <label>
                      Delivery location
                      <input
                        value={editForm.deliveryLocation}
                        onChange={(event) =>
                          setEditForm({ ...editForm, deliveryLocation: event.target.value })
                        }
                        required
                      />
                    </label>

                    <label>
                      Notes
                      <textarea
                        rows={2}
                        value={editForm.notes}
                        onChange={(event) =>
                          setEditForm({ ...editForm, notes: event.target.value })
                        }
                      />
                    </label>

                    <div className="order-action-row">
                      <button className="btn btn-primary" type="submit" disabled={busy}>
                        {busy ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={stopEditing}
                        disabled={busy}
                      >
                        Keep original
                      </button>
                    </div>
                  </form>
                )}

                <div className="customer-order-actions">
                  <Link to={`/orders/${id}`} className="order-details-link">
                    View order details <span aria-hidden="true">→</span>
                  </Link>

                  {pending && !editing && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => startEditing(order)}
                        disabled={busy}
                      >
                        Edit order
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => setConfirmAction({ type: "cancel", order })}
                        disabled={busy}
                      >
                        Cancel order
                      </button>
                    </>
                  )}

                  {canSubmitPayment && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setConfirmAction({ type: "payment", order })}
                      disabled={busy}
                    >
                      {busy ? "Submitting..." : "I’ve paid"}
                    </button>
                  )}

                  {canComplete && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setConfirmAction({ type: "complete", order })}
                      disabled={busy}
                    >
                      Confirm delivery
                    </button>
                  )}
                </div>

                {ACTIVE_STATUSES.includes(status) && !pending && (
                  <p className="customer-order-hint">
                    {status === "OUT_FOR_DELIVERY"
                      ? "Your order is on its way. Confirm payment and delivery when ready."
                      : "Your order is being processed. You’ll see the next step here."}
                  </p>
                )}
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
            if (event.target === event.currentTarget && !busyId) {
              setConfirmAction(null);
            }
          }}
        >
          <section
            className="nitume-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-order-confirm-title"
          >
            <div className="nitume-modal-icon">
              {confirmAction.type === "cancel"
                ? "!"
                : confirmAction.type === "payment"
                  ? "KSh"
                  : "✓"}
            </div>

            <h2 id="customer-order-confirm-title">
              {confirmAction.type === "cancel"
                ? "Cancel this order?"
                : confirmAction.type === "payment"
                  ? "Submit payment for confirmation?"
                  : "Confirm delivery completed?"}
            </h2>

            <p>
              {confirmAction.type === "cancel"
                ? "You can place another request after this order is cancelled."
                : confirmAction.type === "payment"
                  ? "Only continue if you have actually made the payment. The admin will still need to confirm receipt."
                  : "Only confirm if you have received your order and the admin has confirmed your payment."}
            </p>

            <div className="order-action-row">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmAction(null)}
                disabled={Boolean(busyId)}
              >
                Go back
              </button>
              <button
                type="button"
                className={
                  confirmAction.type === "cancel"
                    ? "btn btn-danger"
                    : "btn btn-primary"
                }
                onClick={() => {
                  if (confirmAction.type === "payment") {
                    const order = confirmAction.order;
                    setConfirmAction(null);
                    submitPayment(order);
                  } else {
                    runConfirmedAction();
                  }
                }}
                disabled={Boolean(busyId)}
              >
                {busyId
                  ? "Please wait..."
                  : confirmAction.type === "cancel"
                    ? "Yes, cancel"
                    : confirmAction.type === "payment"
                      ? "Submit payment"
                      : "Complete order"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
