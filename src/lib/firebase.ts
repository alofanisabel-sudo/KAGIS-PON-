import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiP7xQ4htd4VoOVlZpcDMVyCY0eodBjuA",
  authDomain: "pon-kagis.firebaseapp.com",
  projectId: "pon-kagis",
  storageBucket: "pon-kagis.firebasestorage.app",
  messagingSenderId: "724643678167",
  appId: "1:724643678167:web:00660eea2559420f806d92",
};

// Évite de réinitialiser l'app à chaque rechargement (Next.js hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
