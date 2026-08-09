import { cert, getApps, initializeApp } from "firebase-admin/app";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const serviceAccount = require(
  "./loyalty-program-ce00d-firebase-adminsdk-fbsvc-a20767648f.json"
);

const firebaseApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
      })
    : getApps()[0];

export default firebaseApp;