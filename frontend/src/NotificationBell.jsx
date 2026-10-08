import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";

export default function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const handleNotificationClick = async (
    notification
  ) => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    setOpen(false);

    if (notification.order) {
      navigate(`/orders/${notification.order}`);
    }
  };

  return (
    <div
      className="notification-wrapper"
      ref={containerRef}
    >
      <button
        type="button"
        className="notification-button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span className="notification-icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-header">
            <div>
              <h3>Notifications</h3>

              {unreadCount > 0 && (
                <span>
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-read-all"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">
                  🔔
                </div>

                <strong>No notifications</strong>

                <span>
                  We'll let you know when something
                  happens with your orders.
                </span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={`notification-item ${
                    notification.read
                      ? ""
                      : "notification-unread"
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification
                    )
                  }
                >
                  <div className="notification-item-icon">
                    {getNotificationIcon(
                      notification.type
                    )}
                  </div>

                  <div className="notification-item-content">
                    <strong>
                      {notification.title}
                    </strong>

                    <p>
                      {notification.message}
                    </p>

                    <small>
                      {formatNotificationTime(
                        notification.createdAt
                      )}
                    </small>
                  </div>

                  {!notification.read && (
                    <span className="notification-dot" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case "ORDER_CREATED":
      return "🛵";

    case "ORDER_ACCEPTED":
      return "✅";

    case "ORDER_UPDATED":
      return "🔄";

    case "PRICE_CONFIRMED":
      return "💰";

    case "OUT_FOR_DELIVERY":
      return "🚚";

    case "DELIVERED":
      return "📦";

    case "CANCELLED":
      return "❌";

    default:
      return "🔔";
  }
}

function formatNotificationTime(date) {
  if (!date) return "";

  const created = new Date(date);
  const now = new Date();

  const seconds = Math.floor(
    (now - created) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return created.toLocaleDateString();
}
