import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// These are public identifiers (safe in the browser). Data is protected by firestore.rules.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isConfigured = () => !!(config.apiKey && config.projectId && config.appId);

// Lazy so the build doesn't crash when env vars are missing.
function app(): FirebaseApp {
  if (getApps().length) return getApp();
  return initializeApp(
    isConfigured()
      ? config
      : { apiKey: 'missing', projectId: 'missing', appId: 'missing', authDomain: 'missing.firebaseapp.com' }
  );
}

export const getFirebaseAuth = (): Auth => getAuth(app());
export const getDb = (): Firestore => getFirestore(app());
