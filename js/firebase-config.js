// =====================================================
//  FIREBASE CONFIG
//  Remplace ces valeurs par celles de ta console Firebase
//  https://console.firebase.google.com → Ton projet → Paramètres
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "REMPLACE_PAR_TON_API_KEY",
  authDomain:        "REMPLACE_PAR_TON_AUTH_DOMAIN",
  projectId:         "REMPLACE_PAR_TON_PROJECT_ID",
  storageBucket:     "REMPLACE_PAR_TON_STORAGE_BUCKET",
  messagingSenderId: "REMPLACE_PAR_TON_MESSAGING_SENDER_ID",
  appId:             "REMPLACE_PAR_TON_APP_ID"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };
