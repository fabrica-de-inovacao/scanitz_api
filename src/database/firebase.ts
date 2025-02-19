import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import * as firestore from "firebase/firestore";
import { getAuth } from "firebase/auth";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = JSON.parse(process.env.FIREBASE_CREDENTIALS);

console.log("🔥 Firebase Conectado!");

export const app = initializeApp(firebaseConfig);

export const db = firestore.getFirestore(app);
export const auth = getAuth(app);

export default firestore;
