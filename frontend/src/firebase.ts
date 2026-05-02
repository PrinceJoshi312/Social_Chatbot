import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBNdkTSnRCIiqgx1aOEyzAkbx_cgsacP10",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sociallink-50b2a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sociallink-50b2a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sociallink-50b2a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "308458294275",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:308458294275:web:c53879b9a1479d0ad29236"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
