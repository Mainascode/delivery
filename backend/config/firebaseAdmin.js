import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let firebaseApp = null;

export function getFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.log("Firebase Admin credentials not configured.");
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
            /\\n/g,
            "\n"
          ),
        }),
      });
    } else {
      firebaseApp = getApps()[0];
    }

    console.log("Firebase Admin initialized successfully.");

    return firebaseApp;
  } catch (error) {
    console.error(
      "Firebase Admin initialization failed:",
      error.message
    );

    return null;
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();

  if (!app) {
    return null;
  }

  return getAuth(app);
}