/* global importScripts, firebase */

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyADsCJyp8VPK_fqlNapCtRZugUL5WuSh_I",
  authDomain: "delivery-app-7116c.firebaseapp.com",
  projectId: "delivery-app-7116c",
  storageBucket: "delivery-app-7116c.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:390146637598:web:cf51b769a545f5ebfd930f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message",
    payload
  );

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "NITUME";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new notification.",
    icon: "/favicon.ico",
    data: {
      orderId: payload.data?.orderId || "",
      url: payload.data?.url || "/",
    },
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
