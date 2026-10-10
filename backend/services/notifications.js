
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Create and save a notification, then attempt to send
 * a Firebase Cloud Messaging push notification.
 *
 * A push failure must not prevent the database
 * notification from being created.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  orderId = null,
  data = {},
}) {
  if (!userId) {
    throw new Error(
      "userId is required to create a notification"
    );
  }

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error(
      "A notification title and message are required"
    );
  }

  // Save the notification first.
  const notification = await Notification.create({
    user: userId,
    title: title.trim(),
    message: message.trim(),
    type,
    order: orderId,
    data,
  });

  // Attempt push delivery without losing the saved
  // notification if Firebase is unavailable.
  try {
    await sendPushNotification({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      orderId,
      data,
    });
  } catch (error) {
    console.error(
      "Push notification failed:",
      error.message
    );
  }

  return notification;
}

/**
 * Send a push notification to all registered devices
 * belonging to a user.
 */
export async function sendPushNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  orderId = null,
  data = {},
}) {
  try {
    const firebaseApp = getFirebaseAdmin();

    if (!firebaseApp) {
      console.log(
        "Skipping FCM push: Firebase Admin is not configured."
      );

      return {
        success: false,
        skipped: true,
        reason: "firebase_not_configured",
      };
    }

    const user = await User.findById(userId).select(
      "fcmTokens"
    );

    if (!user) {
      console.log(
        `Skipping FCM push: user ${userId} not found.`
      );

      return {
        success: false,
        skipped: true,
        reason: "user_not_found",
      };
    }

    const tokens = [
      ...new Set(
        Array.isArray(user.fcmTokens)
          ? user.fcmTokens.filter(
              (token) =>
                typeof token === "string" &&
                token.trim().length > 0
            )
          : []
      ),
    ];

    if (tokens.length === 0) {
      console.log(
        `No FCM tokens registered for user ${userId}.`
      );

      return {
        success: false,
        skipped: true,
        reason: "no_tokens",
      };
    }

    // Firebase data payload values must be strings.
    // Exclude reserved keys so custom data cannot
    // overwrite notification fields.
    const reservedKeys = new Set([
      "type",
      "orderId",
      "url",
      "title",
      "body",
    ]);

    const extraData = Object.fromEntries(
      Object.entries(
        data && typeof data === "object" && !Array.isArray(data)
          ? data
          : {}
      )
        .filter(
          ([key, value]) =>
            !reservedKeys.has(key) &&
            value !== null &&
            value !== undefined
        )
        .map(([key, value]) => {
          let stringValue;

          if (typeof value === "string") {
            stringValue = value;
          } else {
            stringValue = JSON.stringify(value);
          }

          return [key, stringValue];
        })
        .filter(([, value]) => value !== undefined)
    );

    const messagePayload = {
      notification: {
        title,
        body: message,
      },

      data: {
        ...extraData,
        type: String(type || "SYSTEM"),
        orderId: orderId ? String(orderId) : "",
        url: orderId
          ? `/orders/${orderId}`
          : "/",
        title: String(title),
        body: String(message),
      },

      tokens,
    };

    const messaging = getMessaging(firebaseApp);

    const response =
      await messaging.sendEachForMulticast(
        messagePayload
      );

    console.log(
      `FCM sent: ${response.successCount}/${tokens.length}`
    );

    // Remove tokens that Firebase confirms are invalid.
    const invalidTokens = [];

    response.responses.forEach((result, index) => {
      if (result.success) {
        return;
      }

      const errorCode = result.error?.code;

      if (
        errorCode ===
          "messaging/registration-token-not-registered" ||
        errorCode ===
          "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(tokens[index]);
      }

      console.error(
        `FCM token error (${errorCode || "unknown"}):`,
        result.error?.message || "Unknown Firebase error"
      );
    });

    if (invalidTokens.length > 0) {
      await User.updateOne(
        { _id: userId },
        {
          $pull: {
            fcmTokens: {
              $in: invalidTokens,
            },
          },
        }
      );

      console.log(
        `Removed ${invalidTokens.length} invalid FCM token(s).`
      );
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error(
      "Firebase push delivery error:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
}