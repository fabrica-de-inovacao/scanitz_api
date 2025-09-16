import admin from "firebase-admin";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa o Firebase Admin SDK
 * Este arquivo deve ser importado ANTES de qualquer operação com Firebase
 */
export function initializeFirebaseAdmin() {
  try {
    // Verificar se já foi inicializado
    if (admin.apps.length > 0) {
      console.log("✅ Firebase Admin SDK já inicializado");
      return admin.app();
    }

    // Verificar se as credenciais estão disponíveis
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT não encontrado nas variáveis de ambiente"
      );
    }

    // Inicializar com Service Account Key (JSON string) - compatível com seu .env
    console.log("🔑 Inicializando Firebase Admin SDK...");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log("✅ Firebase Admin SDK inicializado com sucesso!");
    console.log(`📋 Projeto: ${serviceAccount.project_id}`);

    return app;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin SDK:", error.message);
    console.error("\n🔧 Configuração necessária:");
    console.error("1. FIREBASE_PROJECT_ID - ID do projeto Firebase");
    console.error("2. Uma das opções:");
    console.error(
      "   - GOOGLE_APPLICATION_CREDENTIALS - caminho para o arquivo JSON"
    );
    console.error(
      "   - FIREBASE_SERVICE_ACCOUNT_KEY - JSON string das credenciais"
    );
    console.error("   - Estar rodando no Google Cloud (usar ADC)");

    throw error;
  }
}

/**
 * Verifica se o token Firebase é válido
 */
export async function verifyFirebaseToken(token: string) {
  try {
    const app = admin.apps.length > 0 ? admin.app() : initializeFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("❌ Erro ao verificar token Firebase:", error.message);
    throw error;
  }
}

/**
 * Obtém dados do usuário pelo UID
 */
export async function getFirebaseUser(uid: string) {
  try {
    const app = admin.apps.length > 0 ? admin.app() : initializeFirebaseAdmin();
    const user = await app.auth().getUser(uid);
    return user;
  } catch (error) {
    console.error("❌ Erro ao obter usuário Firebase:", error.message);
    throw error;
  }
}

// Inicializar automaticamente quando o módulo for importado
initializeFirebaseAdmin();

export default admin;
