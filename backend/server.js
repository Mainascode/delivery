import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { requireAuth, requireAdmin } from "./middleware/auth.js";
import User from "./models/User.js";
import { connectDB } from "./config/database.js";
import Order from "./models/Order.js";
import Settings from "./models/Settings.js";
import { getCurrentPricing } from "./services/pricing.js";
import notificationRoutes from "./routes/notifications.js";
import { createNotification } from "./services/notifications.js";

await connectDB();

const app = express();

app.use(
cors({
origin: true,
credentials: true,
})
);

app.use(express.json());

/* =========================
NOTIFICATIONS
========================= */

app.use("/api/notifications", notificationRoutes);

/* =========================
BASIC / HEALTH
========================= */

app.get("/", (req, res) => {
res.json({
name: "NITUME API",
status: "running",
});
});

app.get("/api/health", (req, res) => {
res.json({
success: true,
message: "Backend is healthy",
});
});

/* =========================
AUTH / PROFILE
========================= */

app.get("/api/auth/me", requireAuth, async (req, res) => {
res.json({
user: req.user,
});
});

app.patch("/api/auth/profile", requireAuth, async (req, res) => {
try {
const { name, phone } = req.body;

if (typeof name === "string" && name.trim()) {
  req.user.name = name.trim();
}

if (typeof phone === "string") {
  req.user.phone = phone.trim();
}

await req.user.save();

res.json({
  success: true,
  user: {
    id: req.user._id,
    firebaseUid: req.user.firebaseUid,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
  },
});


} catch (error) {
console.error("Profile update error:", error);

res.status(500).json({
  success: false,
  error: "Failed to update profile.",
});


}
});

/* =========================
FCM TOKEN REGISTRATION
========================= */



/* =========================
PRICING
========================= */

app.get("/api/pricing/current", async (req, res) => {
try {
let settings = await Settings.findOne();


if (!settings) {
  settings = await Settings.create({});
}

const pricing = getCurrentPricing(settings.weatherMode);

return res.json(pricing);


} catch (error) {
console.error("Pricing error:", error);

return res.status(500).json({
  success: false,
  error: "Failed to get current pricing.",
});


}
});

/* =========================
CUSTOMER: CREATE ORDER
========================= */

app.post("/api/orders", requireAuth, async (req, res) => {
try {
const { items, pickupLocation, deliveryLocation, notes } =
req.body;


if (
  typeof items !== "string" ||
  !items.trim() ||
  typeof deliveryLocation !== "string" ||
  !deliveryLocation.trim()
) {
  return res.status(400).json({
    success: false,
    error: "Items and delivery location are required.",
  });
}

const activeOrder = await Order.findOne({
  customer: req.user._id,
  status: {
    $in: [
      "PENDING",
      "ACCEPTED",
      "SHOPPING",
      "READY_FOR_DELIVERY",
    ],
  },
});

if (activeOrder) {
  return res.status(409).json({
    success: false,
    error:
      "You already have an active order. Please wait until it is completed or cancelled before placing another.",
    orderId: String(activeOrder._id),
    orderStatus: activeOrder.status,
  });
}


let settings = await Settings.findOne();

if (!settings) {
  settings = await Settings.create({});
}

if (!settings.acceptingRequests) {
  return res.status(400).json({
    success: false,
    error: "Requests are currently paused.",
  });
}

const pricing = getCurrentPricing(settings.weatherMode);

if (!pricing.available) {
  return res.status(400).json({
    success: false,
    error: "Delivery service is currently closed.",
  });
}

const order = await Order.create({
  customer: req.user._id,
  items: items.trim(),
  pickupLocation:
    typeof pickupLocation === "string"
      ? pickupLocation.trim()
      : "",
  deliveryLocation: deliveryLocation.trim(),
  notes: typeof notes === "string" ? notes.trim() : "",
  deliveryFee: pricing.fee,
  pricingMode: pricing.mode,
  pricingRule: pricing.rule,
  status: "PENDING",
});

try {
  const admins = await User.find({ role: "ADMIN" }).select("_id");

  await Promise.allSettled(
    admins.map((admin) =>
      createNotification({
        userId: admin._id,
        title: "New order received",
        message: `A new delivery request #${String(order._id).slice(-6)} is waiting for review.`,
        type: "ORDER_CREATED",
        orderId: order._id,
        data: {
          status: order.status,
        },
      })
    )
  );
} catch (notificationError) {
  // A notification failure must never cancel a successfully created order.
  console.error(
    "Failed to notify admins about the new order:",
    notificationError.message
  );
}

return res.status(201).json({
  success: true,
  message: "Order submitted successfully.",
  order,
});


} catch (error) {
console.error("Create order error:", error);

return res.status(500).json({
  success: false,
  error: "Failed to create order.",
});

}
});

/* =========================
CUSTOMER: LIST ORDERS
Cancelled orders are hidden.
Admins can still see them.
========================= */

app.get("/api/orders", requireAuth, async (req, res) => {
try {
const orders = await Order.find({
customer: req.user._id,
status: { $nin: ["CANCELLED", "REJECTED"] },
}).sort({ createdAt: -1 });


return res.json({
  success: true,
  orders,
});


} catch (error) {
console.error("Get customer orders error:", error);


return res.status(500).json({
  success: false,
  error: "Failed to load orders.",
});


}
});


/* =========================
   CUSTOMER: EDIT PENDING ORDER
========================= */

app.patch("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid order ID.",
      });
    }

    const allowedFields = [
      "items",
      "pickupLocation",
      "deliveryLocation",
      "notes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (
          typeof req.body[field] !== "string" ||
          (field === "items" && !req.body[field].trim()) ||
          (field === "deliveryLocation" && !req.body[field].trim())
        ) {
          return res.status(400).json({
            success: false,
            error: `Invalid value for ${field}.`,
          });
        }

        updates[field] = req.body[field].trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Provide at least one field to update.",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        customer: req.user._id,
        status: "PENDING",
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!order) {
      const existing = await Order.findOne({
        _id: req.params.id,
        customer: req.user._id,
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: "Order not found.",
        });
      }

      return res.status(409).json({
        success: false,
        error:
          "Only pending orders can be edited. This order may already have been approved.",
      });
    }

    return res.json({
      success: true,
      message: "Order updated successfully.",
      order,
    });
  } catch (error) {
    console.error("Edit order error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to update order.",
    });
  }
});


/* =========================
CUSTOMER: CANCEL ORDER
Only pending orders can be
cancelled by their owner.
========================= */

app.post(
"/api/orders/:id/cancel",
requireAuth,
async (req, res) => {
try {
if (!mongoose.isValidObjectId(req.params.id)) {
return res.status(400).json({
success: false,
error: "Invalid order ID.",
});
}


  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      customer: req.user._id,
      status: "PENDING",
    },
    {
      $set: { status: "CANCELLED" },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    const existingOrder = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found.",
      });
    }

    return res.status(409).json({
      success: false,
      error:
        existingOrder.status === "CANCELLED"
          ? "This order has already been cancelled."
          : existingOrder.status === "REJECTED"
            ? "This order has already been rejected."
            : "Only pending orders can be cancelled.",
    });
  }

  // Best-effort notification; cancellation remains successful
  // even if notification delivery fails.
  try {
    await createNotification({
      userId: req.user._id,
      title: "Order cancelled",
      message: "Your delivery request has been cancelled.",
      type: "CANCELLED",
      orderId: order._id,
      data: {
        status: "CANCELLED",
        previousStatus: "PENDING",
      },
    });
  } catch (notificationError) {
    console.error(
      "Customer cancellation notification error:",
      notificationError.message
    );
  }

  return res.json({
    success: true,
    message: "Order cancelled successfully.",
    order,
  });
} catch (error) {
  console.error("Customer cancel order error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to cancel order.",
  });
}


}
);


/* =========================
   CUSTOMER: SUBMIT PAYMENT
   Customer reports that payment
   has been made; this is not
   automatic payment verification.
========================= */

app.patch(
  "/api/orders/:id/payment-submitted",
  requireAuth,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          customer: req.user._id,
          status: "READY_FOR_DELIVERY",
          paymentStatus: "UNPAID",
        },
        {
          $set: {
            paymentStatus: "CUSTOMER_MARKED_PAID",
            paymentSubmittedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        const existing = await Order.findOne({
          _id: req.params.id,
          customer: req.user._id,
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: "Order not found.",
          });
        }

        return res.status(409).json({
          success: false,
          error:
            existing.paymentStatus === "CONFIRMED"
              ? "Payment has already been confirmed."
              : existing.status !== "READY_FOR_DELIVERY"
                ? "Payment can only be submitted when your order is ready for delivery."
                : "Payment has already been submitted for confirmation.",
        });
      }

      const admins = await User.find({ role: "ADMIN" }).select("_id");

      await Promise.allSettled(
        admins.map((admin) =>
          createNotification({
            userId: admin._id,
            title: "Payment submitted",
            message: `Customer reports payment for order #${String(order._id).slice(-6)}. Please verify receipt.`,
            type: "PAYMENT_SUBMITTED",
            orderId: order._id,
            data: { paymentStatus: order.paymentStatus },
          })
        )
      );

      return res.json({
        success: true,
        message: "Payment submitted for confirmation.",
        order,
      });
    } catch (error) {
      console.error("Payment submission error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to submit payment.",
      });
    }
  }
);


/* =========================
   ADMIN: CONFIRM PAYMENT
========================= */

app.patch(
  "/api/orders/:id/payment-confirmation",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "READY_FOR_DELIVERY",
          paymentStatus: "CUSTOMER_MARKED_PAID",
        },
        {
          $set: {
            paymentStatus: "CONFIRMED",
            paymentConfirmedAt: new Date(),
            paymentConfirmedBy: req.user._id,
          },
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        const existing = await Order.findById(req.params.id);

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: "Order not found.",
          });
        }

        return res.status(409).json({
          success: false,
          error:
            existing.paymentStatus === "CONFIRMED"
              ? "Payment is already confirmed."
              : "Payment can only be confirmed after the customer submits it and the order is ready for delivery.",
        });
      }

      await createNotification({
        userId: order.customer,
        title: "Payment confirmed",
        message:
          "Your payment has been confirmed. You can now mark your order as complete.",
        type: "PAYMENT_CONFIRMED",
        orderId: order._id,
        data: {
          paymentStatus: order.paymentStatus,
          status: order.status,
        },
      }).catch((error) => {
        console.error("Payment confirmation notification error:", error);
      });

      return res.json({
        success: true,
        message: "Payment confirmed.",
        order,
      });
    } catch (error) {
      console.error("Payment confirmation error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to confirm payment.",
      });
    }
  }
);


/* =========================
   CUSTOMER: COMPLETE ORDER
   Requires delivery + confirmed payment
========================= */

app.patch(
  "/api/orders/:id/complete",
  requireAuth,
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid order ID.",
        });
      }

      const order = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          customer: req.user._id,
          status: "READY_FOR_DELIVERY",
          paymentStatus: "CONFIRMED",
        },
        {
          $set: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        },
        { new: true, runValidators: true }
      );

      if (!order) {
        const existing = await Order.findOne({
          _id: req.params.id,
          customer: req.user._id,
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: "Order not found.",
          });
        }

        return res.status(409).json({
          success: false,
          error:
            existing.status === "COMPLETED"
              ? "This order is already completed."
              : existing.paymentStatus !== "CONFIRMED"
                ? "Payment must be confirmed by the admin before completing this order."
                : "Only orders that are ready for delivery can be completed.",
        });
      }

      const admins = await User.find({ role: "ADMIN" }).select("_id");

      await Promise.allSettled(
        admins.map((admin) =>
          createNotification({
            userId: admin._id,
            title: "Order completed",
            message: `Customer confirmed completion of order #${String(order._id).slice(-6)}.`,
            type: "DELIVERED",
            orderId: order._id,
            data: { status: order.status },
          })
        )
      );

      return res.json({
        success: true,
        message: "Order completed successfully.",
        order,
      });
    } catch (error) {
      console.error("Customer order completion error:", error);

      return res.status(500).json({
        success: false,
        error: "Failed to complete order.",
      });
    }
  }
);

/* =========================
ADMIN DASHBOARD
========================= */

app.get(
"/api/admin/dashboard",
requireAuth,
requireAdmin,
async (req, res) => {
try {
let settings = await Settings.findOne();


  if (!settings) {
    settings = await Settings.create({});
  }

  const incomingCount = await Order.countDocuments({
    status: "PENDING",
  });

  const activeCount = await Order.countDocuments({
    status: {
      $in: ["ACCEPTED", "SHOPPING", "READY_FOR_DELIVERY"],
    },
  });

  const pricing = getCurrentPricing(settings.weatherMode);

  return res.json({
    success: true,
    incomingCount,
    activeCount,
    pricing,
    settings,
  });
} catch (error) {
  console.error("Admin dashboard error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to load admin dashboard.",
  });
}
}
);

/* =========================
ADMIN: LIST ALL ORDERS
Keep this before /api/orders/:id.
========================= */

app.get(
"/api/orders/admin",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const orders = await Order.find()
.populate("customer", "name email phone")
.sort({ createdAt: -1 });


  return res.json({
    success: true,
    orders,
  });
} catch (error) {
  console.error("Admin orders error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to load orders.",
  });
}


}
);

/* =========================
ADMIN: ORDER DETAILS
========================= */

app.get(
"/api/admin/orders/:id",
requireAuth,
requireAdmin,
async (req, res) => {
try {
if (!mongoose.isValidObjectId(req.params.id)) {
return res.status(400).json({
success: false,
error: "Invalid order ID.",
});
}


const orders = await Order.find({})
  .populate("customer", "name email phone")
  .sort({ createdAt: -1 });

return res.json({
  success: true,
  orders,
});

} catch (error) {
  console.error("Get admin order error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to load order.",
  });
}


}
);

/* =========================
ADMIN: UPDATE ORDER STATUS

PENDING -> ACCEPTED, CANCELLED, REJECTED
ACCEPTED -> SHOPPING, CANCELLED
SHOPPING -> READY_FOR_DELIVERY, CANCELLED
READY_FOR_DELIVERY -> COMPLETED, CANCELLED

Terminal states cannot be changed.
Atomic updates prevent duplicate decisions.
========================= */

app.patch(
"/api/orders/:id/status",
requireAuth,
requireAdmin,
async (req, res) => {
try {
if (!mongoose.isValidObjectId(req.params.id)) {
return res.status(400).json({
success: false,
error: "Invalid order ID.",
});
}

  const { status } = req.body;

  const allowedTransitions = {
    PENDING: ["ACCEPTED", "CANCELLED", "REJECTED"],
    ACCEPTED: ["SHOPPING", "CANCELLED"],
    SHOPPING: ["READY_FOR_DELIVERY", "CANCELLED"],
    READY_FOR_DELIVERY: ["CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
  };

  const validStatuses = Object.keys(allowedTransitions);

  if (
    typeof status !== "string" ||
    !validStatuses.includes(status)
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid order status.",
    });
  }

  const existingOrder = await Order.findById(req.params.id);

  if (!existingOrder) {
    return res.status(404).json({
      success: false,
      error: "Order not found.",
    });
  }

  const previousStatus = existingOrder.status;
  const permitted = allowedTransitions[previousStatus] || [];

  if (!permitted.includes(status)) {
    return res.status(409).json({
      success: false,
      error:
        previousStatus === "PENDING"
          ? "This pending order has already received a decision, or that action is not allowed."
          : `Cannot change an order from ${previousStatus} to ${status}.`,
    });
  }

  // Compare-and-set: only update if the status has not changed
  // since we checked its allowed transition.
  const order = await Order.findOneAndUpdate(
    {
      _id: req.params.id,
      status: previousStatus,
    },
    {
      $set: { status },
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("customer", "name email phone");

  if (!order) {
    return res.status(409).json({
      success: false,
      error:
        "This order was updated by another request. Refresh and try again.",
    });
  }

  const notificationMessages = {
    ACCEPTED: {
      title: "Order accepted",
      message:
        "Your delivery request has been accepted and is being processed.",
      type: "ORDER_ACCEPTED",
    },
    SHOPPING: {
      title: "Shopping started",
      message: "We're now shopping for the items in your order.",
      type: "ORDER_UPDATED",
    },
    READY_FOR_DELIVERY: {
      title: "Your order is ready for delivery",
      message:
        "Your order is ready and will be delivered soon.",
      type: "READY_FOR_DELIVERY",
    },
    COMPLETED: {
      title: "Order delivered",
      message: "Your order has been delivered successfully.",
      type: "DELIVERED",
    },
    CANCELLED: {
      title: "Order cancelled",
      message: "Your delivery request has been cancelled.",
      type: "CANCELLED",
    },
    REJECTED: {
      title: "Order declined",
      message:
        "Unfortunately, your delivery request could not be accepted.",
      type: "CANCELLED",
    },
  };

  const notification = notificationMessages[status];

  if (notification) {
    try {
      await createNotification({
        userId: existingOrder.customer,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        orderId: existingOrder._id,
        data: {
          status,
          previousStatus,
        },
      });
    } catch (notificationError) {
      console.error(
        "Order notification creation error:",
        notificationError.message
      );
    }
  }

  return res.json({
    success: true,
    message: `Order status updated to ${status}.`,
    order,
  });
} catch (error) {
  console.error("Update order status error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to update order status.",
  });
}

}
);

/* =========================
ADMIN SETTINGS
========================= */

app.patch(
"/api/admin/settings",
requireAuth,
requireAdmin,
async (req, res) => {
try {
let settings = await Settings.findOne();


  if (!settings) {
    settings = await Settings.create({});
  }

  if (typeof req.body.acceptingRequests === "boolean") {
    settings.acceptingRequests = req.body.acceptingRequests;
  }

  if (
    req.body.weatherMode === "NORMAL" ||
    req.body.weatherMode === "RAIN"
  ) {
    settings.weatherMode = req.body.weatherMode;
  }

  await settings.save();

  return res.json({
    success: true,
    settings,
  });
} catch (error) {
  console.error("Admin settings error:", error);

  return res.status(500).json({
    success: false,
    error: "Failed to update settings.",
  });
}

}
);

/* =========================
CUSTOMER: ORDER DETAILS
Hide cancelled and rejected orders.
========================= */

app.get("/api/orders/:id", requireAuth, async (req, res) => {
try {
if (!mongoose.isValidObjectId(req.params.id)) {
return res.status(400).json({
success: false,
error: "Invalid order ID.",
});
}


const order = await Order.findOne({
  _id: req.params.id,
  customer: req.user._id,
  status: { $nin: ["CANCELLED", "REJECTED"] },
});

if (!order) {
  return res.status(404).json({
    success: false,
    error: "Order not found.",
  });
}

return res.json({
  success: true,
  order,
});


} catch (error) {
console.error("Get customer order error:", error);


return res.status(500).json({
  success: false,
  error: "Failed to get order.",
});


}
});

/* =========================
START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`NITUME backend running on https://delivery-y1yc.onrender.com`);
});
