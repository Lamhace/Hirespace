import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAiLCWA0anMBYug5D_LdYgCaZNbbrB_kDY",
  authDomain: "hirespace-8daba.firebaseapp.com",
  databaseURL: "https://hirespace-8daba-default-rtdb.firebaseio.com",
  projectId: "hirespace-8daba",
  storageBucket: "hirespace-8daba.firebasestorage.app",
  messagingSenderId: "717410551032",
  appId: "1:717410551032:web:4e795fada69bee6bc8670d",
  measurementId: "G-27LVGKSX8L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);
export const rtdb = getDatabase(app);
