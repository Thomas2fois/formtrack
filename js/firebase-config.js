// =====================================================
//  FIREBASE CONFIG
//  Remplace ces valeurs par celles de ta console Firebase
//  https://console.firebase.google.com → Ton projet → Paramètres
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyApdBRSZoSsTKU2Z71yRzdCATLoE4ScAGc",
  authDomain:        "budget-mensuel-52aa9.firebaseapp.com",
  projectId:         "budget-mensuel-52aa9",
  storageBucket:     "budget-mensuel-52aa9.firebasestorage.app",
  messagingSenderId: "675021368593",
  appId:             "1:675021368593:web:7479541e6c105427afb0b0",
  measurementId: "G-YBRXR7PVHP"
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider };
