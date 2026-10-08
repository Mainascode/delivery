import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

import firebaseApp from "./firebase";

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission() {
  if (
    typeof window === "undefined" ||
    !("Notification" in window)
  ) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "This browser does not support service workers."
    );
  }

  const supported = await isSupported();

  if (!supported) {
    throw new Error(
      "Firebase Cloud Messaging is not supported in this browser."
    );
  }

  if (!VAPID_KEY) {
    throw new Error(
      "VITE_FIREBASE_VAPID_KEY is missing."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

  const messaging = getMessaging(firebaseApp);

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error(
      "Firebase did not return a notification token."
    );
  }

  return token;
}

export async function listenForForegroundMessages(
  callback
) {
  const supported = await isSupported();

  if (!supported) {
    return () => {};
  }

  const messaging = getMessaging(firebaseApp);

  return onMessage(messaging, callback);
}
