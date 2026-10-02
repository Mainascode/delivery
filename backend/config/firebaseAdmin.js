import admin from "firebase-admin";

let initialized = false;

export function getFirebaseAdmin() {
  if (initialized) {
    return admin;
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
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
          /\\n/g,
          "\n"
        ),
      }),
    });

    initialized = true;

    console.log("Firebase Admin initialized successfully.");

    return admin;
  } catch (error) {
    console.error(
      "Firebase Admin initialization failed:",
      error.message
    );

    return null;
  }
}