import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore'

/**
 * Firebase client initialization.
 * Firestore enables IndexedDB persistence in a best-effort way to improve
 * offline/latency friendliness (ignored when unsupported or multi-tab conflicts).
 */

export type FirebaseConfigStatus =
  | { ok: true }
  | { ok: false; missingKeys: string[]; message: string };

function readFirebaseEnv() {
  const env = (import.meta as any).env ?? {};
  return {
    apiKey: String(env.VITE_FIREBASE_API_KEY ?? ''),
    authDomain: String(env.VITE_FIREBASE_AUTH_DOMAIN ?? ''),
    projectId: String(env.VITE_FIREBASE_PROJECT_ID ?? ''),
    appId: String(env.VITE_FIREBASE_APP_ID ?? ''),
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

export function getFirebaseConfigStatus(): FirebaseConfigStatus {
  const env = readFirebaseEnv();
  const missingKeys: string[] = [];

  if (!env.apiKey) missingKeys.push('VITE_FIREBASE_API_KEY');
  if (!env.authDomain) missingKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!env.projectId) missingKeys.push('VITE_FIREBASE_PROJECT_ID');
  if (!env.appId) missingKeys.push('VITE_FIREBASE_APP_ID');

  if (missingKeys.length > 0) {
    return {
      ok: false,
      missingKeys,
      message:
        'Firebase env belum lengkap. Cek VITE_FIREBASE_* di .env (local) atau GitHub Secrets (Pages build).',
    };
  }

  return { ok: true };
}

function getFirebaseConfigOrThrow(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
} {
  const status = getFirebaseConfigStatus();
  if (!status.ok) {
    throw new Error(status.message);
  }

  const env = readFirebaseEnv();
  return {
    apiKey: env.apiKey,
    authDomain: env.authDomain,
    projectId: env.projectId,
    appId: env.appId,
    storageBucket: env.storageBucket,
    messagingSenderId: env.messagingSenderId,
    measurementId: env.measurementId,
  };
}

export function getFirebaseApp() {
  if (getApps().length) return getApps()[0]!
  // Important: do not throw during module import. Only validate when the app is actually requested.
  const config = getFirebaseConfigOrThrow()
  return initializeApp(config)
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function getFirestoreDb() {
  const firestore = getFirestore(getFirebaseApp())
  // Best-effort offline cache. Ignore if unsupported or multi-tab conflict.
  if (!persistenceTried) {
    persistenceTried = true
    enableIndexedDbPersistence(firestore).catch(() => {
      // ignore
    })
  }
  return firestore
}

export function getFirebaseFunctions() {
  const env = (import.meta as any).env ?? {}
  const region = String(env.VITE_FIREBASE_FUNCTIONS_REGION ?? '').trim()
  return region ? getFunctions(getFirebaseApp(), region) : getFunctions(getFirebaseApp())
}

let persistenceTried = false
