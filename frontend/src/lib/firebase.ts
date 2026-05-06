import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId) {
  throw new Error("Firebase env vars are missing. Check .env");
}

export const firebaseApp: FirebaseApp = initializeApp(config);
export const firebaseAuth: Auth = getAuth(firebaseApp);

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<{ idToken: string; user: FirebaseUser }> {
  const result = await signInWithPopup(firebaseAuth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}

export async function signOutFromFirebase(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}
