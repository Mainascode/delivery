import express from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/notifications
 * Get the logged-in user's notifications
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark one notification as read
 */
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      {
        read: true,
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        read: false,
      },
      {
        read: true,
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update notifications",
    });
  }
});

export default router;
