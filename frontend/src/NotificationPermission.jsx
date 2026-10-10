import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { auth } from "./services/firebase";
import {
  requestNotificationPermission,
  syncExistingNotificationPermission,
} from "./services/fcm";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://delivery-y1yc.onrender.com"
).replace(/\/+$/, "");

async function updateNotificationPreference(enabled, token = null) {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("Please sign in to manage notifications.");
  }

  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/api/notifications/preferences`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled, token }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || "Unable to update notification settings."
    );
  }

  return data;
}

async function registerNotificationToken(token) {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("Please sign in to enable notifications.");
  }

  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/api/notifications/fcm-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Your session expired. Sign in again and retry.");
    }

    throw new Error(
      data.error || data.message || "Failed to register this device."
    );
  }

  return data;
}

export default function NotificationPermission() {
  const { user, profile, loading: authLoading } = useAuth();

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [preferenceOverride, setPreferenceOverride] = useState(null);
  const automaticSyncUser = useRef(null);

  const accountEnabled = profile?.notificationsEnabled === true;
  const effectiveAccountEnabled = preferenceOverride ?? accountEnabled;
  const busy = status === "enabling" || status === "disabling";

  useEffect(() => {
    setPreferenceOverride(null);
    automaticSyncUser.current = null;
  }, [user?.uid]);

  // Automatically refresh an existing token only when the account preference
  // is enabled and browser permission has already been granted.
  // This never opens a browser permission prompt.
  useEffect(() => {
    if (authLoading || !user || !effectiveAccountEnabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (automaticSyncUser.current === user.uid) return;

    automaticSyncUser.current = user.uid;
    let cancelled = false;

    async function syncToken() {
      try {
        const token = await syncExistingNotificationPermission();

        if (cancelled || !token) return;

        await registerNotificationToken(token);

        if (!cancelled) {
          setStatus("enabled");
          setMessage("Your notification device is up to date.");
        }
      } catch (error) {
        console.error("Automatic notification sync failed:", error);

        if (!cancelled) {
          setStatus("error");
          setMessage(
            "We couldn't refresh notifications on this device. You can try enabling them again."
          );
        }
      }
    }

    syncToken();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, effectiveAccountEnabled]);

  const enableNotifications = useCallback(async () => {
    if (busy) return;

    try {
      setStatus("enabling");
      setMessage("");

      if (!auth.currentUser) {
        throw new Error("Please sign in to enable notifications.");
      }

      // This function requests browser permission only following this click.
      const token = await requestNotificationPermission();

      if (!token || typeof token !== "string") {
        throw new Error("No notification token was returned. Please retry.");
      }

      await registerNotificationToken(token);

      automaticSyncUser.current = auth.currentUser.uid;
      setPreferenceOverride(true);
      setStatus("enabled");
      setMessage("Notifications are enabled on this device.");
    } catch (error) {
      console.error("Enable notifications failed:", error);
      setStatus("error");
      setMessage(error?.message || "Unable to enable notifications.");
    }
  }, [busy]);

  const disableNotifications = useCallback(async () => {
    if (busy) return;

    try {
      setStatus("disabling");
      setMessage("");

      let token = null;

      // Try to identify this device's token. Disabling must still work if
      // permission was revoked or Firebase cannot retrieve the token.
      try {
        token = await syncExistingNotificationPermission();
      } catch (tokenError) {
        console.warn("Could not retrieve the current device token:", tokenError);
      }

      await updateNotificationPreference(false, token);

      automaticSyncUser.current = null;
      setPreferenceOverride(false);
      setStatus("idle");
      setMessage("Push notifications are disabled for your account.");
    } catch (error) {
      console.error("Disable notifications failed:", error);
      setStatus("error");
      setMessage(error?.message || "Unable to disable notifications.");
    }
  }, [busy]);

  if (authLoading) {
    return (
      <div className="notification-permission">
        <p>Loading notification settings…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="notification-permission">
        <p>Please sign in to manage notification settings.</p>
      </div>
    );
  }

  const enabled = preferenceOverride ?? (status === "enabled" || (status === "idle" && accountEnabled));

  return (
    <div className="notification-permission">
      <div className="notification-permission-info">
        <div className="notification-permission-icon" aria-hidden="true">
          {enabled ? "🔔" : "🔕"}
        </div>

        <div>
          <strong>
            {enabled ? "Notifications enabled" : "Order notifications"}
          </strong>
          <p>
            {enabled
              ? "Receive updates about your NITUME orders."
              : "Get updates when your order status changes."}
          </p>
        </div>
      </div>

      {message && (
        <p
          className={`notification-permission-message ${
            status === "error" ? "error" : "success"
          }`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      )}

      {enabled ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={disableNotifications}
          disabled={busy}
        >
          {status === "disabling" ? "Disabling…" : "Disable notifications"}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          onClick={enableNotifications}
          disabled={busy}
        >
          {status === "enabling" ? "Enabling…" : "Enable notifications"}
        </button>
      )}

      <p className="notification-permission-note">
        Push notification preferences apply to your account, not just this
        device. Your browser must also allow notifications for this site.
      </p>
    </div>
  );
}
