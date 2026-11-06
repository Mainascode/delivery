
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";
import { auth } from "../services/firebase";

const NotificationContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://delivery-y1yc.onrender.com";

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

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Notification service returned an unexpected response (HTTP ${response.status}).`
    );
  }

  return response.json();
}

export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent overlapping requests for the same account.
  const inFlightRef = useRef(null);

  const fetchNotifications = useCallback(() => {
    const uid = user?.uid;

    if (!uid) {
      setNotifications([]);
      setError("");
      return Promise.resolve();
    }

    const existingRequest = inFlightRef.current;

    if (existingRequest?.uid === uid) {
      return existingRequest.promise;
    }

    const request = (async () => {
      try {
        setLoading(true);
        setError("");

        const headers = await getAuthHeaders();

        // Do not continue if the signed-in account changed.
        if (auth.currentUser?.uid !== uid) return;

        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

        const data = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to load notifications."
          );
        }

        // Prevent an old account's response updating the new account.
        if (auth.currentUser?.uid !== uid) return;

        setNotifications(data.notifications || []);
        setError("");
      } catch (err) {
        if (auth.currentUser?.uid === uid) {
          console.warn(
            "Notifications temporarily unavailable:",
            err.message
          );

          setError(err.message);
        }
      } finally {
        if (inFlightRef.current?.promise === request) {
          inFlightRef.current = null;
        }

        setLoading(false);
      }
    })();

    inFlightRef.current = {
      uid,
      promise: request,
    };

    return request;
  }, [user?.uid]);

  // Load immediately after authentication and refresh periodically.
  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setNotifications([]);
      setError("");
      setLoading(false);
      return;
    }

    fetchNotifications();

    const refreshNotifications = () => {
      if (document.visibilityState === "visible") {
        fetchNotifications();
      }
    };

    const interval = window.setInterval(
      refreshNotifications,
      60000
    );

    window.addEventListener(
      "focus",
      refreshNotifications
    );

    document.addEventListener(
      "visibilitychange",
      refreshNotifications
    );

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        "focus",
        refreshNotifications
      );

      document.removeEventListener(
        "visibilitychange",
        refreshNotifications
      );
    };
  }, [
    authLoading,
    user?.uid,
    fetchNotifications,
  ]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        const headers = await getAuthHeaders();

        const response = await fetch(
          `${API_URL}/api/notifications/${notificationId}/read`,
          {
            method: "PATCH",
            headers,
          }
        );

        const data = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to mark notification as read."
          );
        }

        setNotifications((current) =>
          current.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
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

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();

      const response = await fetch(
        `${API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers,
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Failed to mark notifications as read."
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
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
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
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
}
