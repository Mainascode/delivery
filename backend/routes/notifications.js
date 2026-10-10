
import express from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * Register or refresh an FCM token for the authenticated user.
 * POST /api/notifications/fcm-token
 */
router.post("/fcm-token", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (
      typeof token !== "string" ||
      token.trim().length < 20 ||
      token.length > 4096
    ) {
      return res.status(400).json({
        success: false,
        error: "A valid FCM token is required.",
      });
    }

    const cleanToken = token.trim();

    await req.user.updateOne({
      $addToSet: { fcmTokens: cleanToken },
      $set: { notificationsEnabled: true },
    });

    return res.json({
      success: true,
      notificationsEnabled: true,
      message: "Notification device registered.",
    });
  } catch (error) {
    console.error("Register FCM token error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to register notification device.",
    });
  }
});

/**
 * Remove one device token.
 * DELETE /api/notifications/fcm-token
 */
router.delete("/fcm-token", requireAuth, async (req, res) => {
  try {
    const { token } = req.body;

    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        error: "The device token is required.",
      });
    }

    await req.user.updateOne({
      $pull: { fcmTokens: token.trim() },
    });

    const updatedUser = await req.user.constructor
      .findById(req.user._id)
      .select("fcmTokens notificationsEnabled");

    return res.json({
      success: true,
      message: "Notification device removed.",
      remainingDevices: updatedUser?.fcmTokens?.length || 0,
    });
  } catch (error) {
    console.error("Remove FCM token error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to remove notification device.",
    });
  }
});

/**
 * Update the account-level push preference.
 * PATCH /api/notifications/preferences
 *
 * Optional token removes the current device when disabling.
 */
router.patch("/preferences", requireAuth, async (req, res) => {
  try {
    const { enabled, token } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "enabled must be true or false.",
      });
    }

    const update = {
      $set: { notificationsEnabled: enabled },
    };

    if (
      enabled === false &&
      typeof token === "string" &&
      token.trim()
    ) {
      update.$pull = { fcmTokens: token.trim() };
    }

    await req.user.updateOne(update);

    return res.json({
      success: true,
      notificationsEnabled: enabled,
      message: enabled
        ? "Push notifications enabled."
        : "Push notifications disabled.",
    });
  } catch (error) {
    console.error("Update notification preferences error:", error.message);

    return res.status(500).json({
      success: false,
      error: "Failed to update notification preferences.",
    });
  }
});

/**
 * GET /api/notifications
 * Get the authenticated user's notification history.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications.",
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Keep this route before /:id/read.
 */
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      { $set: { read: true } },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
    });
  }
});

export default router;
