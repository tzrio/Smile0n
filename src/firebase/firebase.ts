import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFunctions } from 'firebase/functions'
import { getFirestore } from 'firebase/firestore'

type FirebaseEnv = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  measurementId?: string
}

function readEnv(): FirebaseEnv {
  const env = (import.meta as any).env ?? {}

  const apiKey = String(env.VITE_FIREBASE_API_KEY ?? '')
  const authDomain = String(env.VITE_FIREBASE_AUTH_DOMAIN ?? '')
  const projectId = String(env.VITE_FIREBASE_PROJECT_ID ?? '')
  const appId = String(env.VITE_FIREBASE_APP_ID ?? '')

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error('Firebase env belum lengkap. Cek VITE_FIREBASE_* di .env')
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  }
}

export function getFirebaseApp() {
  if (getApps().length) return getApps()[0]!
  const config = readEnv()
  return initializeApp(config)
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp())
}

export function getFirebaseFunctions() {
  const env = (import.meta as any).env ?? {}
  const region = String(env.VITE_FIREBASE_FUNCTIONS_REGION ?? '').trim()
  return region ? getFunctions(getFirebaseApp(), region) : getFunctions(getFirebaseApp())
}
