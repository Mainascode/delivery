import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./services/api";

const ACTIVE_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "SHOPPING",
  "READY_FOR_DELIVERY",
];

function formatStatus(status = "PENDING") {
  return status.replaceAll("_", " ").toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status) {
  if (["COMPLETED", "CONFIRMED", "SUCCESS"].includes(status)) {
    return "status-badge status-success";
  }
  if (["CANCELLED", "REJECTED", "FAILED"].includes(status)) {
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

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `KES ${amount.toLocaleString("en-KE")}`
    : "Not available";
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentClock, setPaymentClock] = useState(Date.now());
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
  const [phoneNumbers, setPhoneNumbers] = useState({});
  const [paymentInfo, setPaymentInfo] = useState({});

  const loadOrders = useCallback(async (refresh = false) => {
    try {
      setError("");
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const data = await api("/api/orders");
      const latestOrders = data.orders || [];
      setOrders(latestOrders);

      setEditingId((currentId) => {
        if (!currentId) return "";
        const currentOrder = latestOrders.find(
          (order) => (order._id || order.id) === currentId
        );
        return currentOrder?.status === "PENDING" ? currentId : "";
      });
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Unable to load your orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const checkPayment = useCallback(async (id) => {
    try {
      const data = await api(`/api/orders/${id}/payment`);
      setPaymentInfo((current) => ({ ...current, [id]: data }));
      return data;
    } catch (err) {
      console.error(`Unable to check payment for ${id}:`, err);
      return null;
    }
  }, []);

  useEffect(() => {
  const timer = setInterval(() => {
    setPaymentClock(Date.now());
  }, 1000);

  return () => clearInterval(timer);
}, []);

  useEffect(() => {
    loadOrders();

    const refreshOrders = () => {
      if (document.visibilityState === "visible") loadOrders(true);
    };

    const interval = setInterval(refreshOrders, 15000);
    window.addEventListener("focus", refreshOrders);
    document.addEventListener("visibilitychange", refreshOrders);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshOrders);
      document.removeEventListener("visibilitychange", refreshOrders);
    };
  }, [loadOrders]);

  // Check payment records for orders that have entered the M-Pesa stage.
  useEffect(() => {
    const ids = orders
      .filter((order) => order.status === "READY_FOR_DELIVERY")
      .map((order) => order._id || order.id)
      .filter(Boolean);

    if (!ids.length) return;

    const checkAll = () => {
      if (document.visibilityState !== "visible") return;
      ids.forEach((id) => checkPayment(id));
    };

    checkAll();
    const interval = setInterval(checkAll, 10000);
    return () => clearInterval(interval);
  }, [orders, checkPayment]);
  function startEditing(order) {
    setNotice("");
    setError("");
    setEditingId(order._id || order.id);
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
      setError(err.message || "Unable to update this order.");
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

      await api(`/api/orders/${id}/cancel`, { method: "POST" });
      setConfirmAction(null);
      setNotice(`${shortId(id)} has been cancelled.`);
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to cancel this order.");
    } finally {
      setBusyId("");
    }
  }

  async function requestMpesaPayment(order) {
    const id = order._id || order.id;
    const phoneNumber = (phoneNumbers[id] || "").trim();

    if (!phoneNumber) {
      setError("Enter the Safaricom phone number that should receive the M-Pesa prompt.");
      return;
    }

    try {
      setBusyId(id);
      setError("");
      setNotice("");

      const data = await api(`/api/orders/${id}/stk-push`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });

      setPaymentInfo((current) => ({ ...current, [id]: data }));
      setNotice(
        data.message ||
        "M-Pesa request sent. Check your phone and enter your M-Pesa PIN."
      );

      await checkPayment(id);
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to initiate M-Pesa payment.");
      // Refresh the payment record because Safaricom may have received
      // the request even if the browser did not receive its response.
      await checkPayment(id);
      await loadOrders(true);
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

      await api(`/api/orders/${id}/complete`, { method: "PATCH" });
      setConfirmAction(null);
      setNotice("Order completed. Thanks for using NITUME!");
      await loadOrders(true);
    } catch (err) {
      setError(err.message || "Unable to complete this order.");
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
            <p className="page-description">Loading your requests and deliveries...</p>
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
            Track your requests, pay securely, and confirm delivery.
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
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {notice && (
        <div className="nitume-feedback nitume-feedback-success" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button>
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
            const orderPayment = paymentInfo[id];
            const payment = orderPayment?.payment || {};
           const paymentStatus =
  payment.status === "SUCCESS" ||
  orderPayment?.paymentStatus === "CONFIRMED" ||
  order.paymentStatus === "CONFIRMED"
    ? "CONFIRMED"
    : payment.status ||
      orderPayment?.paymentStatus ||
      order.paymentStatus ||
      "UNPAID";
            const pending = status === "PENDING";
            const busy = busyId === id;
            const editing = editingId === id;
            const failedPayment = ["FAILED", "CANCELLED", "TIMEOUT"].includes(
  paymentStatus
);

const retryAt = payment.initiatedAt
  ? new Date(payment.initiatedAt).getTime() + 50000
  : 0;

const retrySeconds = retryAt
  ? Math.max(0, Math.ceil((retryAt - paymentClock) / 1000))
  : 0;

const canSubmitPayment =
  status === "READY_FOR_DELIVERY" &&
  (
    paymentStatus === "UNPAID" ||
    (
      failedPayment &&
      retryAt > 0 &&
      retrySeconds === 0
    )
  );
  const canComplete =
  status === "READY_FOR_DELIVERY" &&
  paymentStatus === "CONFIRMED";
            return (
              <article className="order-card customer-order-card" key={id}>
                <div className="order-card-top">
                  <div>
                    <span className="order-meta-label">ORDER REFERENCE</span>
                    <h2>{shortId(id)}</h2>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={statusClass(status)}>{formatStatus(status)}</span>
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
                    <strong className="order-fee">{money(order.deliveryFee)}</strong>
                  </div>
                </div>

                {order.notes && (
                  <div className="customer-order-notes">
                    <span className="order-meta-label">YOUR NOTES</span>
                    <p>{order.notes}</p>
                  </div>
                )}

                {status === "READY_FOR_DELIVERY" && (
                  <div className="customer-payment-panel">
                    <div>
                      <span className="order-meta-label">PAYMENT BREAKDOWN</span>
                      <div className="customer-order-detail">
                        <span>Shopping cost</span>
                        <strong>{money(order.shoppingCost)}</strong>
                      </div>
                      <div className="customer-order-detail">
                        <span>Delivery fee</span>
                        <strong>{money(order.deliveryFee)}</strong>
                      </div>
                      <div className="customer-order-detail">
                        <span><strong>Total to pay</strong></span>
                        <strong className="order-fee">{money(order.totalAmount)}</strong>
                      </div>
                    </div>

                    <div>
                      <span className="order-meta-label">M-PESA PAYMENT STATUS</span>
                      <strong>{formatStatus(paymentStatus)}</strong>
                      {payment.mpesaReceiptNumber && (
                        <p className="customer-order-hint">
                          Receipt: <strong>{payment.mpesaReceiptNumber}</strong>
                        </p>
                      )}
                      {paymentStatus === "CONFIRMED" && (
                        <p className="customer-order-hint">
                          ✓ Payment verified. You can now confirm delivery.
                        </p>
                      )}
                      {paymentStatus === "REVIEW_REQUIRED" && (
                        <p className="customer-order-hint">
                          Your payment is being checked. Do not send another payment.
                          Contact NITUME support if this status does not change.
                        </p>
                      )}
                      {["PENDING", "INITIATED"].includes(paymentStatus) && (
                        <p className="customer-order-hint">
                          M-Pesa request is being processed. Check your phone and
                          enter your PIN if prompted. This page checks for updates.
                        </p>
                      )}
                      {failedPayment && (
                       <p className="customer-order-hint">
                        Your previous payment attempt failed.
                         {retrySeconds > 0
                          ? ` You can retry in ${retrySeconds} seconds.`
                             : " You can try again now."}
                           </p>
                           )}
                    </div>

                    {canSubmitPayment && (
                      <div className="order-edit-form">
                        <label>
                          Safaricom M-Pesa phone number
                          <input
                            type="tel"
                            inputMode="tel"
                            placeholder="Enter number"
                            value={phoneNumbers[id] || ""}
                            onChange={(event) =>
                              setPhoneNumbers((current) => ({
                                ...current,
                                [id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => requestMpesaPayment(order)}
                          disabled={busy}
                        >
                          {busy ? "Sending request..." : `Pay ${money(order.totalAmount)} with M-Pesa`}
                        </button>
                      </div>
                    )}
                  </div>
                )}

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
                        onChange={(event) => setEditForm({ ...editForm, items: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Pickup / shop location
                      <input
                        value={editForm.pickupLocation}
                        onChange={(event) => setEditForm({ ...editForm, pickupLocation: event.target.value })}
                      />
                    </label>
                    <label>
                      Delivery location
                      <input
                        value={editForm.deliveryLocation}
                        onChange={(event) => setEditForm({ ...editForm, deliveryLocation: event.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Notes
                      <textarea
                        rows={2}
                        value={editForm.notes}
                        onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })}
                      />
                    </label>
                    <div className="order-action-row">
                      <button className="btn btn-primary" type="submit" disabled={busy}>
                        {busy ? "Saving..." : "Save changes"}
                      </button>
                      <button className="btn btn-secondary" type="button" onClick={stopEditing} disabled={busy}>
                        Keep original
                      </button>
                    </div>
                  </form>
                )}

                <div className="customer-order-actions">
                  {pending && !editing && (
                    <>
                      <button type="button" className="btn btn-secondary" onClick={() => startEditing(order)} disabled={busy}>
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
                    {status === "READY_FOR_DELIVERY"
                      ? "Your shopping is complete. Review the amount and pay using the M-Pesa prompt."
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
            if (event.target === event.currentTarget && !busyId) setConfirmAction(null);
          }}
        >
          <section
            className="nitume-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-order-confirm-title"
          >
            <div className="nitume-modal-icon">
              {confirmAction.type === "cancel" ? "!" : "✓"}
            </div>
            <h2 id="customer-order-confirm-title">
              {confirmAction.type === "cancel"
                ? "Cancel this order?"
                : "Confirm delivery completed?"}
            </h2>
            <p>
              {confirmAction.type === "cancel"
                ? "You can place another request after this order is cancelled."
                : "Only confirm if you have received your order. Payment must already be verified."}
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
                className={confirmAction.type === "cancel" ? "btn btn-danger" : "btn btn-primary"}
                onClick={runConfirmedAction}
                disabled={Boolean(busyId)}
              >
                {busyId ? "Please wait..." : confirmAction.type === "cancel" ? "Yes, cancel" : "Complete order"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}