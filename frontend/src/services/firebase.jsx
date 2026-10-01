import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADsCJyp8VPK_fqlNapCtRZugUL5WuSh_I",
  authDomain: "delivery-app-7116c.firebaseapp.com",
  projectId: "delivery-app-7116c",
  storageBucket: "delivery-app-7116c.firebasestorage.app",
  messagingSenderId: "390146637598",
  appId: "1:390146637598:web:cf51b769a545f5ebfd930f",
  measurementId: "G-MFY2H4GGSX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;