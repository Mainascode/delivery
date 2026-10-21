import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { listenForForegroundMessages } from "./services/fcm";

export default function ForegroundNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    let unsubscribe = () => {};
    let toastTimer;

    async function startListening() {
      try {
        const stop = await listenForForegroundMessages((payload) => {
          if (!active) return;

          const title =
            payload.notification?.title ||
            payload.data?.title ||
            "NITUME";

          const body =
            payload.notification?.body ||
            payload.data?.body ||
            "You have a new notification.";

          const url = payload.data?.url || "/";

          setToast({ title, body, url });

          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => {
            if (active) setToast(null);
          }, 6000);

          // Display a system notification when permission is granted.
          // Using the service worker is more suitable for supported
          // mobile browsers and installed web apps.
          if (
            "Notification" in window &&
            Notification.permission === "granted" &&
            "serviceWorker" in navigator
          ) {
            navigator.serviceWorker.ready
              .then((registration) =>
                registration.showNotification(title, {
                  body,
                  icon: "/favicon.ico",
                  data: { url },
                  tag: payload.data?.orderId
                    ? `nitume-order-${payload.data.orderId}`
                    : `nitume-${Date.now()}`,
                })
              )
              .catch((error) => {
                console.error(
                  "Could not display system notification:",
                  error
                );
              });
          }
        });

        if (active) {
          unsubscribe = stop;
        } else {
          stop();
        }
      } catch (error) {
        console.error(
          "Could not start foreground notifications:",
          error
        );
      }
    }

    startListening();

    return () => {
      active = false;
      unsubscribe();
      clearTimeout(toastTimer);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    function handleNotificationClick(event) {
      const url = event.detail?.url || "/";
      navigate(url);
    }

    // Service worker messages can be used by the app to navigate
    // when a notification is clicked.
    navigator.serviceWorker.addEventListener(
      "message",
      handleNotificationClick
    );

    return () => {
      navigator.serviceWorker.removeEventListener(
        "message",
        handleNotificationClick
      );
    };
  }, [navigate]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "max(16px, env(safe-area-inset-top))",
        right: "16px",
        left: "16px",
        zIndex: 99999,
        maxWidth: "420px",
        marginLeft: "auto",
        padding: "16px",
        borderRadius: "18px",
        background: "#211638",
        color: "#ffffff",
        border: "1px solid rgba(196, 181, 253, 0.35)",
        boxShadow: "0 14px 40px rgba(20, 10, 40, 0.3)",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "start" }}>
        <div
          aria-hidden="true"
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: "13px",
            background: "#7c3aed",
            fontSize: "20px",
          }}
        >
          🔔
        </div>

        <button
          type="button"
          onClick={() => {
            const url = toast.url;
            setToast(null);
            navigate(url);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "left",
            border: 0,
            padding: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            cursor: "pointer",
          }}
        >
          <strong style={{ display: "block", marginBottom: "5px" }}>
            {toast.title}
          </strong>
          <span style={{ display: "block", color: "#e9e1f5", fontSize: "14px" }}>
            {toast.body}
          </span>
          <span
            style={{
              display: "block",
              marginTop: "9px",
              color: "#c4b5fd",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Tap to view
          </span>
        </button>

        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => setToast(null)}
          style={{
            border: 0,
            background: "transparent",
            color: "#ffffff",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
