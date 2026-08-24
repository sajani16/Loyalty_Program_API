import { cert, getApps, initializeApp } from "firebase-admin/app";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;

try {
  // Try to load from the JSON file in the config directory
  const jsonFilePath = join(__dirname, "loyalty-program-ce00d-firebase-adminsdk-fbsvc-a20767648f.json");
  serviceAccount = JSON.parse(readFileSync(jsonFilePath, "utf-8"));
} catch (fileError) {
  try {
    // Fallback: try environment variable
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      throw new Error("Firebase service account not configured");
    }
  } catch (error) {
    console.error("Failed to load Firebase service account:", error);
    throw new Error("Firebase service account configuration failed");
  }
}

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

export default firebaseApp;