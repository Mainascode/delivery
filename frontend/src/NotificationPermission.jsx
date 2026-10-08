import React, { useState } from "react";

import {
  requestNotificationPermission,
} from "./services/fcm";

import { auth } from "./services/firebase";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function NotificationPermission() {
  const [status, setStatus] =
    useState("idle");

  const [message, setMessage] =
    useState("");

  const enableNotifications =
    async () => {
      try {
        setStatus("loading");
        setMessage("");

        const token =
          await requestNotificationPermission();

        const firebaseUser =
          auth.currentUser;

        if (!firebaseUser) {
          throw new Error(
            "You must be signed in to enable notifications."
          );
        }

        const idToken =
          await firebaseUser.getIdToken();

        const response = await fetch(
          `${API_URL}/api/notifications/fcm-token`,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              token,
            }),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to register notifications."
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
          error.message ||
            "We couldn't enable notifications."
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

          <p>
            {message}
          </p>
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

        <p>
          Get notified when your NITUME request
          is accepted, shopping starts, or your
          order is out for delivery.
        </p>
      </div>

      <button
        type="button"
        onClick={enableNotifications}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Enabling..."
          : "Enable notifications"}
      </button>

      {status === "error" && (
        <small>
          {message}
        </small>
      )}
    </div>
  );
}