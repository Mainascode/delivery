import "dotenv/config";
import express from "express";
import cors from "cors";

import { requireAuth, requireAdmin } from "./middleware/auth.js";
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
   BASIC
========================= */

app.get("/", (req, res) => {
  res.json({
    name: "Delivery App API",
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
      error: "Failed to update profile",
    });
  }
});

/* =========================
   FCM NOTIFICATIONS
========================= */

app.post(
  "/api/notifications/fcm-token",
  requireAuth,
  async (req, res) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({
          success: false,
          error: "FCM token is required",
        });
      }

      if (!Array.isArray(req.user.fcmTokens)) {
        req.user.fcmTokens = [];
      }

      if (!req.user.fcmTokens.includes(token)) {
        req.user.fcmTokens.push(token);
        await req.user.save();
      }

      res.json({
        success: true,
        message: "FCM token registered",
      });
    } catch (error) {
      console.error(
        "Register FCM token error:",
        error
      );

      res.status(500).json({
        success: false,
        error: "Failed to register FCM token",
      });
    }
  }
);
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

    res.json(pricing);
  } catch (error) {
    console.error("Pricing error:", error);

    res.status(500).json({
      error: "Failed to get current pricing",
    });
  }
});

/* =========================
   CUSTOMER ORDERS
========================= */

app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const {
      items,
      pickupLocation,
      deliveryLocation,
      notes,
    } = req.body;

    if (!items || !deliveryLocation) {
      return res.status(400).json({
        error: "Items and delivery location are required",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    if (!settings.acceptingRequests) {
      return res.status(400).json({
        error: "Requests are currently paused",
      });
    }

    const pricing = getCurrentPricing(settings.weatherMode);

    if (!pricing.available) {
      return res.status(400).json({
        error: "Delivery service is currently closed",
      });
    }

    const order = await Order.create({
      customer: req.user._id,
      items: items.trim(),
      pickupLocation: pickupLocation?.trim() || "",
      deliveryLocation: deliveryLocation.trim(),
      notes: notes?.trim() || "",
      deliveryFee: pricing.fee,
      pricingMode: pricing.mode,
      pricingRule: pricing.rule,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      error: "Failed to create order",
    });
  }
});

app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      error: "Failed to get orders",
    });
  }
});

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
          $in: [
            "ACCEPTED",
            "SHOPPING",
            "OUT_FOR_DELIVERY",
          ],
        },
      });

      const pricing = getCurrentPricing(
        settings.weatherMode
      );

      res.json({
        success: true,
        incomingCount,
        activeCount,
        pricing,
        settings,
      });
    } catch (error) {
      console.error("Admin dashboard error:", error);

      res.status(500).json({
        error: "Failed to load admin dashboard",
      });
    }
  }
);

/* =========================
   ADMIN ORDERS
   IMPORTANT:
   This route MUST come before
   /api/orders/:id
========================= */

app.get(
  "/api/orders/admin",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("customer", "name email phone")
        .sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("Admin orders error:", error);

      res.status(500).json({
        error: "Failed to load orders",
      });
    }
  }
);

/* =========================
   ADMIN ORDER DETAILS
========================= */

app.get(
  "/api/admin/orders/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate("customer", "name email phone");

      if (!order) {
        return res.status(404).json({
          success: false,
          error: "Order not found",
        });
      }

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Get admin order error:", error);

      res.status(500).json({
        success: false,
        error: "Failed to load order",
      });
    }
  }
);

/* =========================
   ADMIN ORDER STATUS
========================= */

app.patch(
  "/api/orders/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const allowedStatuses = [
        "PENDING",
        "ACCEPTED",
        "SHOPPING",
        "OUT_FOR_DELIVERY",
        "COMPLETED",
        "CANCELLED",
        "REJECTED",
      ];

      const { status } = req.body;

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: "Invalid order status",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          error: "Order not found",
        });
      }

      const previousStatus = order.status;

      // Don't create a notification if nothing actually changed
      if (previousStatus === status) {
        return res.json({
          success: true,
          order,
        });
      }

      order.status = status;

      await order.save();

      const notifications = {
        ACCEPTED: {
          title: "Order accepted",
          message:
            "Your delivery request has been accepted and is being processed.",
          type: "ORDER_ACCEPTED",
        },

        SHOPPING: {
          title: "Shopping started",
          message:
            "We're now shopping for the items in your order.",
          type: "ORDER_UPDATED",
        },

        OUT_FOR_DELIVERY: {
          title: "Your order is on the way",
          message:
            "Your order has been collected and is now out for delivery.",
          type: "OUT_FOR_DELIVERY",
        },

        COMPLETED: {
          title: "Order delivered",
          message:
            "Your order has been delivered successfully.",
          type: "DELIVERED",
        },

        CANCELLED: {
          title: "Order cancelled",
          message:
            "Your delivery request has been cancelled.",
          type: "CANCELLED",
        },

        REJECTED: {
          title: "Order declined",
          message:
            "Unfortunately, your delivery request could not be accepted.",
          type: "CANCELLED",
        },
      };

      const notification = notifications[status];

      if (notification) {
        await createNotification({
          userId: order.customer,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          orderId: order._id,
          data: {
            status,
            previousStatus,
          },
        });
      }

      res.json({
        success: true,
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error);

      res.status(500).json({
        error: "Failed to update order status",
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

      if (
        typeof req.body.acceptingRequests === "boolean"
      ) {
        settings.acceptingRequests =
          req.body.acceptingRequests;
      }

      if (
        req.body.weatherMode === "NORMAL" ||
        req.body.weatherMode === "RAIN"
      ) {
        settings.weatherMode =
          req.body.weatherMode;
      }

      await settings.save();

      res.json({
        success: true,
        settings,
      });
    } catch (error) {
      console.error("Admin settings error:", error);

      res.status(500).json({
        error: "Failed to update settings",
      });
    }
  }
);

/* =========================
   CUSTOMER ORDER DETAILS
   IMPORTANT:
   This dynamic route MUST come
   AFTER /api/orders/admin
========================= */

app.get("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      error: "Failed to get order",
    });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`
  );
});
