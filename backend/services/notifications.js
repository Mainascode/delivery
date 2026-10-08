import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getFirebaseAdmin } from "../config/firebaseAdmin.js";
import { getMessaging } from "firebase-admin/messaging";

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

  // Always save the notification to MongoDB first.
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    order: orderId,
    data,
  });

  // Try sending the push notification.
  // Push failure should NOT prevent the database
  // notification from being created.
  try {
    await sendPushNotification({
      userId,
      title,
      message,
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

export async function sendPushNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  orderId = null,
  data = {},
}) {
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

  const tokens = Array.isArray(user.fcmTokens)
    ? user.fcmTokens.filter(Boolean)
    : [];

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

  const messaging = getMessaging(firebaseApp);

  const messagePayload = {
    notification: {
      title,
      body: message,
    },

    data: {
      type: String(type || "SYSTEM"),
      orderId: orderId
        ? String(orderId)
        : "",
      url: orderId
        ? `/orders/${orderId}`
        : "/",
      title: String(title),
      body: String(message),

      ...Object.fromEntries(
        Object.entries(data || {}).map(
          ([key, value]) => [
            key,
            String(value),
          ]
        )
      ),
    },

    tokens,
  };

  const response =
    await messaging.sendEachForMulticast(
      messagePayload
    );

  console.log(
    `FCM sent: ${response.successCount}/${tokens.length}`
  );

  // Remove tokens that Firebase says are no longer valid.
  const invalidTokens = [];

  response.responses.forEach(
    (result, index) => {
      if (result.success) {
        return;
      }

      const errorCode =
        result.error?.code;

      if (
        errorCode ===
          "messaging/registration-token-not-registered" ||
        errorCode ===
          "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(tokens[index]);
      }

      console.error(
        `FCM token error (${errorCode}):`,
        result.error?.message
      );
    }
  );

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
}