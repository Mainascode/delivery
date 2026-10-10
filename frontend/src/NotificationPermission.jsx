
import React, { useState } from "react";

import {
  requestNotificationPermission,
} from "./services/fcm";

import { auth } from "./services/firebase";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

export default function NotificationPermission() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const enableNotifications = async () => {
    if (status === "loading") return;

    try {
      setStatus("loading");
      setMessage("");

      // The user must be signed in first.
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error(
          "Please sign in to enable notifications."
        );
      }

      // Request browser permission and obtain an FCM token.
      const token = await requestNotificationPermission();

      if (!token || typeof token !== "string") {
        throw new Error(
          "Firebase did not return a notification token. Please try again."
        );
      }

      // Get a fresh Firebase ID token for backend authentication.
      const idToken = await firebaseUser.getIdToken();

      // Register the FCM token with the NITUME backend.
      const response = await fetch(
        `${API_URL}/api/notifications/fcm-token`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your session could not be verified. Please sign out, sign in again, and retry."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Your account is not allowed to register this notification token."
          );
        }

        throw new Error(
          data.error ||
            data.message ||
            "Failed to register notifications with NITUME."
        );
      }

      setStatus("enabled");
      setMessage(
        "Notifications are enabled. You'll receive updates about your orders."
      );
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );

      setStatus("error");

      setMessage(
        error?.message ||
          "We couldn't enable notifications. Please try again."
      );
    }
  };

  if (status === "enabled") {
    return (
      <div className="notification-permission success">
        <div>
          <strong>
            🔔 Notifications are enabled
          </strong>

          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-permission">
      <div>
        <strong>
          Stay updated on your orders
        </strong>
      </div>
      <p> 

      </p>

      <button
        type="button"
        onClick={enableNotifications}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Enabling..."
          : status === "error"
            ? "Try again"
            : "Enable notifications"}
      </button>
      

      {status === "error" && (
        <small role="alert">
          {message}
        </small>
      )}
    </div>
  );
}