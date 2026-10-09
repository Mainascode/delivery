import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

function formatStatus(status) {
return (
String(status || "UNKNOWN")
.replaceAll("_", " ")
.toLowerCase()
.replace(/\b\w/g, (letter) => letter.toUpperCase())
);
}

function getStatusClass(status) {
const normalized = String(status || "").toUpperCase();

if (normalized === "CANCELLED" || normalized === "REJECTED") {
return "cancelled";
}

if (normalized === "COMPLETED") {
return "completed";
}

if (normalized === "ACCEPTED") {
return "pending";
}

return "active";
}

function formatDate(value) {
if (!value) return "Unknown";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return "Unknown";
}

return date.toLocaleString("en-KE", {
dateStyle: "medium",
timeStyle: "short",
});
}

function getShortId(order) {
const id = order?._id || order?.id;

if (!id) {
return "UNKNOWN";
}

return String(id).slice(-6).toUpperCase();
}

function getCustomer(order) {
return (
order?.customer ||
order?.user ||
order?.customerInfo ||
null
);
}

function getCustomerName(order) {
const customer = getCustomer(order);

return (
customer?.name ||
order?.customerName ||
order?.userName ||
"Customer"
);
}

function getCustomerEmail(order) {
const customer = getCustomer(order);

return (
customer?.email ||
order?.customerEmail ||
order?.email ||
"No email"
);
}

function getCustomerPhone(order) {
const customer = getCustomer(order);

return (
customer?.phone ||
order?.customerPhone ||
order?.phone ||
"No phone number"
);
}

function renderItems(items) {
if (!items) {
return "No items provided.";
}

if (Array.isArray(items)) {
if (items.length === 0) {
return "No items provided.";
}


return (
  <div className="admin-detail-items">
    {items.map((item, index) => {
      if (typeof item === "string") {
        return (
          <div
            className="admin-detail-item"
            key={`${item}-${index}`}
          >
            <span className="admin-detail-item-number">
              {index + 1}
            </span>

            <span>{item}</span>
          </div>
        );
      }

      const name =
        item?.name ||
        item?.item ||
        item?.description ||
        "Item";

      const quantity = item?.quantity;

      return (
        <div
          className="admin-detail-item"
          key={`${name}-${index}`}
        >
          <span className="admin-detail-item-number">
            {index + 1}
          </span>

          <div>
            <strong>{name}</strong>

            {quantity != null && (
              <span>
                Quantity: {quantity}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);


}

return ( <div className="detail-text">
{String(items)} </div>
);
}

export default function AdminOrderDetails() {
const { id } = useParams();

const [order, setOrder] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
let mounted = true;


async function loadOrder() {
  setLoading(true);
  setError("");

  try {
    // Our current backend exposes:
    // GET /api/orders/:id
   const data = await api(`/api/admin/orders/${id}`);

    if (mounted) {
      setOrder(data.order || null);
    }
  } catch (err) {
    console.error("Failed to load admin order:", err);

    if (mounted) {
      setError(
        err.message || "Unable to load this order."
      );
    }
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
}

if (id) {
  loadOrder();
} else {
  setLoading(false);
  setError("No order ID was provided.");
}

return () => {
  mounted = false;
};


}, [id]);

if (loading) {
return ( <div className="page"> <div className="admin-loading"> <div className="spinner" />


      <p>Loading order...</p>
    </div>
  </div>
);


}

if (error || !order) {
return ( <div className="page"> <div className="admin-empty"> <div className="admin-empty-icon">⚠</div>

```
      <h2>Order unavailable</h2>

      <p>
        {error || "This order could not be found."}
      </p>

      <Link
        to="/operator/orders"
        className="btn btn-primary"
      >
        ← Back to orders
      </Link>
    </div>
  </div>
);


}

const customerName = getCustomerName(order);
const customerEmail = getCustomerEmail(order);
const customerPhone = getCustomerPhone(order);

const shortId = getShortId(order);

const deliveryFee =
order.deliveryFee != null
? `KES ${Number(order.deliveryFee).toLocaleString("en-KE")}`
: "Not available";

const pricingMode =
order.pricingMode ||
order.pricing?.mode ||
"NORMAL";

return ( <div className="page admin-order-details-page">
{/* PAGE HEADER */} <div className="admin-page-heading"> <div> <Link
         to="/operator/orders"
         className="admin-back-link"
       >
← Back to orders </Link>

```
      <span className="eyebrow">
        ORDER DETAILS
      </span>

      <h1>#{shortId}</h1>

      <p>
        Created {formatDate(order.createdAt)}
      </p>
    </div>

    <span
      className={`admin-status ${getStatusClass(
        order.status
      )}`}
    >
      {formatStatus(order.status)}
    </span>
  </div>

  {/* ORDER DETAILS */}
  <div className="order-details-grid">

    {/* CUSTOMER */}
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            CUSTOMER
          </span>

          <h2>Customer information</h2>
        </div>
      </div>

      <div className="detail-customer">
        <div className="customer-avatar large">
          {customerName
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <strong>{customerName}</strong>

          <span>{customerEmail}</span>

          <span>{customerPhone}</span>
        </div>
      </div>
    </section>

    {/* ORDER SUMMARY */}
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            DELIVERY
          </span>

          <h2>Order information</h2>
        </div>
      </div>

      <div className="detail-list">
        <div>
          <span>Status</span>

          <strong>
            {formatStatus(order.status)}
          </strong>
        </div>

        <div>
          <span>Delivery fee</span>

          <strong>{deliveryFee}</strong>
        </div>

        <div>
          <span>Pricing mode</span>

          <strong>{pricingMode}</strong>
        </div>

        <div>
          <span>Order ID</span>

          <strong>#{shortId}</strong>
        </div>
      </div>
    </section>

    {/* ITEMS */}
    <section className="admin-panel detail-wide">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            SHOPPING REQUEST
          </span>

          <h2>Items requested</h2>
        </div>
      </div>

      {renderItems(order.items)}
    </section>

    {/* PICKUP */}
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            PICKUP
          </span>

          <h2>Shop / collection</h2>
        </div>
      </div>

      <div className="detail-text">
        {order.pickupLocation ||
          "Not provided."}
      </div>
    </section>

    {/* DELIVERY */}
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">
            DELIVERY
          </span>

          <h2>Destination</h2>
        </div>
      </div>

      <div className="detail-text">
        {order.deliveryLocation ||
          "Not provided."}
      </div>
    </section>

    {/* NOTES */}
    {order.notes && (
      <section className="admin-panel detail-wide">
        <div className="admin-panel-heading">
          <div>
            <span className="eyebrow">
              CUSTOMER NOTES
            </span>

            <h2>Additional instructions</h2>
          </div>
        </div>

        <div className="detail-text">
          {order.notes}
        </div>
      </section>
    )}
  </div>

  {/* BACK ACTION */}
  <div className="admin-detail-footer">
    <Link
      to="/operator/orders"
      className="btn btn-secondary"
    >
      ← Back to all orders
    </Link>
  </div>
</div>


);
}
