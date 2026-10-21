
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useNotifications } from "./context/NotificationContext";
import { listenForForegroundMessages } from "./services/fcm";
import "./ForegroundNotifications.css";

const getNotificationIcon = (type = "") => {
  const value = String(type).toUpperCase();

  if (value.includes("ORDER")) return "📦";
  if (value.includes("DELIVERY")) return "🛵";
  if (value.includes("PAYMENT")) return "💳";
  if (value.includes("COMPLETE")) return "✨";
  if (value.includes("CANCEL")) return "⚠️";
  if (value.includes("PROMO")) return "🎉";

  return "🔔";
};

export default function ForegroundNotifications() {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!user) {
      setToast(null);
      return undefined;
    }

    let active = true;
    let unsubscribe = () => {};

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

          const type = payload.data?.type || "SYSTEM";
          const rawUrl = payload.data?.url || "/";
          const url = rawUrl.startsWith("/") ? rawUrl : "/";
          const id = ++sequenceRef.current;

          clearTimeout(timerRef.current);

          setToast({
            id,
            title,
            body,
            type,
            url,
            icon: getNotificationIcon(type),
          });

          timerRef.current = setTimeout(() => {
            if (active) setToast(null);
          }, 6500);

          // Refresh the saved notification history.
          // The custom toast below is the only foreground popup:
          // deliberately do not call showNotification() here.
          fetchNotifications().catch((error) => {
            console.error("Could not refresh notifications:", error);
          });
        });

        if (active) {
          unsubscribe = stop;
        } else {
          stop();
        }
      } catch (error) {
        console.error("Could not start NITUME notifications:", error);
      }
    }

    startListening();

    return () => {
      active = false;
      unsubscribe();
      clearTimeout(timerRef.current);
    };
  }, [user?.uid, fetchNotifications]);

  const dismissToast = () => {
    clearTimeout(timerRef.current);
    setToast(null);
  };

  const openToast = () => {
    if (!toast) return;

    const url = toast.url;
    dismissToast();
    navigate(url);
  };

  if (!toast) return null;

  return (
    <div className="nitume-toast-region" aria-live="polite" aria-atomic="true">
      <article
        key={toast.id}
        className="nitume-toast"
        role="status"
      >
        <div className="nitume-toast-accent" />

        <div className="nitume-toast-icon" aria-hidden="true">
          {toast.icon}
          <span className="nitume-toast-icon-glow" />
        </div>

        <button
          type="button"
          className="nitume-toast-content"
          onClick={openToast}
          aria-label={`${toast.title}. ${toast.body}. Open notification`}
        >
          <span className="nitume-toast-brand">
            <span className="nitume-toast-brand-dot" />
            NITUME
            <span className="nitume-toast-time">JUST NOW</span>
          </span>

          <strong className="nitume-toast-title">
            {toast.title}
          </strong>

          <span className="nitume-toast-message">
            {toast.body}
          </span>

          <span className="nitume-toast-action">
            View update <span aria-hidden="true">↗</span>
          </span>
        </button>

        <button
          type="button"
          className="nitume-toast-close"
          onClick={dismissToast}
          aria-label="Dismiss notification"
        >
          ×
        </button>

        <div className="nitume-toast-progress" key={toast.id}>
          <span />
        </div>
      </article>
    </div>
  );
}
