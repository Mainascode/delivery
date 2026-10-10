
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

import firebaseApp from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

async function getReadyServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  // Register the worker and wait until a worker is active.
  const registration = await navigator.serviceWorker.register(
    SERVICE_WORKER_PATH
  );

  const readyRegistration = await navigator.serviceWorker.ready;

  if (!readyRegistration.active) {
    throw new Error(
      "The notification service worker is not active yet. Refresh the page and try again."
    );
  }

  if (readyRegistration.scope !== registration.scope) {
    throw new Error(
      "The notification service worker registration is inconsistent. Please refresh and try again."
    );
  }

  return readyRegistration;
}

export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    throw new Error("This browser does not support notifications.");
  }

  if (!(await isSupported())) {
    throw new Error(
      "Firebase Cloud Messaging is not supported in this browser."
    );
  }

  if (!VAPID_KEY) {
    throw new Error(
      "VITE_FIREBASE_VAPID_KEY is missing from your frontend environment."
    );
  }

  let permission = Notification.permission;

  // Only request permission as a result of the user's explicit action.
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "denied") {
    throw new Error(
      "Notifications are blocked. Enable them in your browser or phone settings, then try again."
    );
  }

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await getReadyServiceWorker();
  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error(
      "Firebase did not return a notification token. Please try again."
    );
  }

  return token;
}

/**
 * Refresh/retrieve a token only when the user has already granted
 * browser permission. This function never opens a permission prompt.
 */
export async function syncExistingNotificationPermission() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return null;
  }

  if (!(await isSupported())) {
    return null;
  }

  if (!VAPID_KEY) {
    throw new Error("VITE_FIREBASE_VAPID_KEY is missing.");
  }

  const registration = await getReadyServiceWorker();
  const messaging = getMessaging(firebaseApp);

  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

export async function listenForForegroundMessages(callback) {
  if (!(await isSupported())) {
    return () => {};
  }

  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, callback);
}
