import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

/*
    Firebase web config is not secret — it ships in the bundle either way — but it
    is read from env vars so the same code can point at a different project
    without a rebuild, and so the repo carries no project-specific values.
*/
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isGoogleAuthConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isGoogleAuthConfigured ? initializeApp(firebaseConfig) : null;

const provider = new GoogleAuthProvider();

/* Resolves to the Firebase ID token, which the server verifies with the admin SDK. */
export const authWithGoogle = async () => {
    if (!isGoogleAuthConfigured) {
        throw new Error("Google sign-in is not configured");
    }

    const result = await signInWithPopup(getAuth(app), provider);

    return result.user.getIdToken();
};
