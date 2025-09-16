import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Inicializar Firebase Admin SDK se ainda não foi inicializado
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log("🔥 Firebase Admin SDK inicializado!");
}

export const adminAuth = admin.auth();
export const adminFirestore = admin.firestore();

export default admin;
