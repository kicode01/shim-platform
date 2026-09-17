import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrfKWZIqPH89_Emlq_O4uUDAt4RI07dUc",
  authDomain: "shim-platform.firebaseapp.com",
  projectId: "shim-platform",
  storageBucket: "shim-platform.firebasestorage.app",
  messagingSenderId: "1064462576349",
  appId: "1:1064462576349:web:618d2510bd10dff5714934",
  measurementId: "G-WT501CVN70"
};

// Initialize Firebase (Singleton pattern to prevent re-initialization in Next.js hot reloads)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Analytics must only be initialized in the browser (not on the server during SSR)
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, analytics };
