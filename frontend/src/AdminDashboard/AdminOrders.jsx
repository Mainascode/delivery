import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const allowedActions = {
PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
ACCEPTED: ["SHOPPING", "CANCELLED"],
SHOPPING: ["OUT_FOR_DELIVERY", "CANCELLED"],
OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
COMPLETED: [],
CANCELLED: [],
REJECTED: [],
};

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
case "REJECTED":
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

return id ? String(id).slice(-6).toUpperCase() : "UNKNOWN";
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
const [notice, setNotice] = useState("");
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

  setError(err.message || "Unable to load customer orders.");
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

const currentStatus = order.status || "PENDING";
const permitted = allowedActions[currentStatus] || [];

if (!permitted.includes(status)) {
  setError(
    `That action is not allowed for an order with status ${formatStatus(currentStatus)}.`
  );
  return;
}

const actionMessages = {
  ACCEPTED: "Accept this order and begin processing it?",
  REJECTED: "Reject this order? This decision cannot be undone.",
  CANCELLED: "Cancel this order? This decision cannot be undone.",
  SHOPPING: "Mark this order as shopping in progress?",
  OUT_FOR_DELIVERY: "Mark this order as out for delivery?",
  COMPLETED: "Mark this order as completed?",
};

const isFinalDecision =
  currentStatus === "PENDING" &&
  ["ACCEPTED", "REJECTED", "CANCELLED"].includes(status);

if (
  !window.confirm(
    actionMessages[status] ||
      `Change order status to ${formatStatus(status)}?`
  )
) {
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

  setNotice(
    isFinalDecision
      ? `Order #${getShortId(order)} has been ${status === "ACCEPTED" ? "accepted" : status === "REJECTED" ? "rejected" : "cancelled"}.`
      : `Order #${getShortId(order)} updated to ${formatStatus(status)}.`
  );

  await loadOrders(true);
} catch (err) {
  console.error("Failed to update order:", err);

  setError(
    err.message ||
      "Unable to update order status. Refresh and try again."
  );
} finally {
  setUpdatingId(null);
}


}

return ( <div className="page operator-orders-page"> 
<div className="admin-page-heading"> <div> 
  
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
      disabled={refreshing || Boolean(updatingId)}
    >
      {refreshing ? "Refreshing..." : "↻ Refresh"}
    </button>
  </div>

  {error && (
    <div className="admin-alert admin-alert-error" role="alert">
      <span>{error}</span>

      <button
        type="button"
        onClick={() => loadOrders()}
        disabled={Boolean(updatingId)}
      >
        Try again
      </button>
    </div>
  )}

  {notice && (
    <div className="admin-alert" role="status">
      {notice}
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
        const currentStatus = order.status || "PENDING";
        const customer = order.customer;
        const actions = allowedActions[currentStatus] || [];
        const isUpdating = updatingId === id;
        const isPending = currentStatus === "PENDING";

        return (
          <article className="admin-order-card" key={id}>
            <div className="admin-order-top">
              <div>
                <span className="order-label">ORDER</span>

                <h2>#{getShortId(order)}</h2>

                <small>{formatDate(order.createdAt)}</small>
              </div>

              <span
                className={`admin-status ${getStatusClass(currentStatus)}`}
              >
                {formatStatus(currentStatus)}
              </span>
            </div>

            <div className="admin-customer">
              <div className="customer-avatar">
                {getCustomerInitial(order)}
              </div>

              <div>
                <strong>{customer?.name || "Customer"}</strong>

                {customer?.phone && <p>{customer.phone}</p>}

                {customer?.email && <span>{customer.email}</span>}
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
                    ? `KES ${order.deliveryFee}`
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

            <div className="admin-order-actions">
              <div className="admin-order-actions-header">
                <strong>
                  {isPending ? "Review this request" : "Order actions"}
                </strong>

                {isUpdating && (
                  <span className="updating-text">
                    Updating...
                  </span>
                )}
              </div>

              {actions.length > 0 ? (
                <div className="status-actions">
                  {actions.map((status) => {
                    const actionLabels = {
                      ACCEPTED: "Accept order",
                      REJECTED: "Reject order",
                      CANCELLED: "Cancel order",
                      SHOPPING: "Start shopping",
                      OUT_FOR_DELIVERY: "Out for delivery",
                      COMPLETED: "Mark completed",
                    };

                    return (
                      <button
                        type="button"
                        key={status}
                        className={`status-action ${
                          status === "REJECTED" ||
                          status === "CANCELLED"
                            ? "danger"
                            : status === "ACCEPTED" ||
                                status === "COMPLETED"
                              ? "selected"
                              : ""
                        }`}
                        disabled={Boolean(updatingId)}
                        onClick={() => updateStatus(order, status)}
                      >
                        {isUpdating
                          ? "Updating..."
                          : actionLabels[status] || formatStatus(status)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="updating-text">
                  This order is {formatStatus(currentStatus).toLowerCase()}.
                  No further status changes are available.
                </p>
              )}

              {isPending && (
                <p className="updating-text">
                  Choose one decision. Once accepted, the order can
                  progress through delivery but cannot return to pending.
                </p>
              )}
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
