import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import { auth } from "../services/firebase";

const NotificationContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

async function getAuthHeaders() {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("You must be signed in.");
  }

  const token = await firebaseUser.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/notifications`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to load notifications"
        );
      }

      setNotifications(
        data.notifications || []
      );
    } catch (err) {
      console.error(
        "Notification fetch error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }

    if (!authLoading && !user) {
      setNotifications([]);
      setError("");
    }
  }, [
    authLoading,
    user,
    fetchNotifications,
  ]);

  // Refresh notifications periodically.
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const headers =
          await getAuthHeaders();

        const response = await fetch(
          `${API_URL}/api/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to mark notification as read"
          );
        }

        setNotifications((current) =>
          current.map((notification) =>
            notification._id ===
            notificationId
              ? {
                  ...notification,
                  read: true,
                }
              : notification
          )
        );
      } catch (err) {
        console.error(
          "Mark notification read error:",
          err
        );
      }
    },
    []
  );

  const markAllAsRead = useCallback(
    async () => {
      try {
        const headers =
          await getAuthHeaders();

        const response = await fetch(
          `${API_URL}/api/notifications/read-all`,
          {
            method: "PATCH",
            headers,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to mark notifications as read"
          );
        }

        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            read: true,
          }))
        );
      } catch (err) {
        console.error(
          "Mark all notifications read error:",
          err
        );
      }
    },
    []
  );

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !notification.read
      ).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      error,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    ]
  );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context =
    useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}