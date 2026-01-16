import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword as fbUpdatePassword,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import type { Role, User } from './authTypes'
import { getFirebaseAuth, getFirestoreDb } from '../firebase/firebase'
import { isoNow } from '../utils/date'

type LoginInput = {
  email: string
  password: string
}

type AuthState = {
  user: User | null
  login: (input: LoginInput) => Promise<void>
  logout: () => void
  hasRole: (roles: Role[]) => boolean
  updateProfile: (patch: Pick<User, 'name' | 'avatarDataUrl'>) => Promise<void>
  updatePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>
}

const STORAGE_KEY = 'wallDecorAdmin.auth.user'
const PROFILE_KEY = 'wallDecorAdmin.auth.profiles.v1'
const PASSWORDS_KEY = 'wallDecorAdmin.auth.passwords.v1'

const MOCK_USERS: Array<User & { password: string }> = [
  { id: 'u_ceo', email: 'ceo@walldecor.local', name: 'Rakha', role: 'CEO', password: 'admin123' },
  { id: 'u_cto', email: 'cto@walldecor.local', name: 'Roihan', role: 'CTO', password: 'admin123' },
  { id: 'u_cmo', email: 'cmo@walldecor.local', name: 'Bagus', role: 'CMO', password: 'admin123' },
]

function isFirebaseMode(): boolean {
  const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
  return raw === 'firebase'
}

function normalizeRole(value: unknown): Role {
  const raw = String(value ?? '')
  if (raw === 'CEO' || raw === 'CTO' || raw === 'CMO' || raw === 'PENDING') return raw
  return 'PENDING'
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function saveUser(user: User | null) {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch {
    // ignore storage failures (e.g. blocked storage in some environments)
  }
}

type StoredProfile = Pick<User, 'name' | 'avatarDataUrl'>

function loadProfiles(): Record<string, StoredProfile> {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, StoredProfile>
  } catch {
    return {}
  }
}

function saveProfiles(profiles: Record<string, StoredProfile>) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles))
  } catch {
    // ignore
  }
}

function loadPasswords(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

function savePasswords(passwords: Record<string, string>) {
  try {
    localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords))
  } catch {
    // ignore
  }
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => (isFirebaseMode() ? null : loadUser()))

  useEffect(() => {
    if (!isFirebaseMode()) return

    const auth = getFirebaseAuth()
    const db = getFirestoreDb()
    let unsubProfile: null | (() => void) = null

    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        if (unsubProfile) {
          unsubProfile()
          unsubProfile = null
        }
        setUser(null)
        return
      }

      void (async () => {
        const ref = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(ref)
        const email = fbUser.email ?? ''

        if (!snap.exists()) {
          // Spark plan flow: user document starts as non-privileged.
          // CEO will approve by changing users/{uid}.role to CEO/CTO/CMO.
          const now = isoNow()
          const initial = {
            email,
            name: fbUser.displayName ?? email.split('@')[0] ?? 'User',
            role: 'PENDING',
            position: '',
            avatarDataUrl: '',
            createdAt: now,
            updatedAt: now,
          }
          await setDoc(ref, initial, { merge: true })
        }

        if (unsubProfile) {
          unsubProfile()
          unsubProfile = null
        }

        // Subscribe so role changes (approve/ACC) reflect immediately in the UI.
        unsubProfile = onSnapshot(
          ref,
          (ds) => {
            const data = (ds.data() as any) ?? {}
            const nextUser: User = {
              id: fbUser.uid,
              email,
              name: String(data?.name ?? fbUser.displayName ?? email.split('@')[0] ?? 'User'),
              role: normalizeRole(data?.role),
              avatarDataUrl: data?.avatarDataUrl ? String(data.avatarDataUrl) : undefined,
            }
            setUser(nextUser)
          },
          (err) => {
            console.error('Failed to subscribe user profile', err)
            setUser(null)
          }
        )
      })().catch((err) => {
        console.error('Failed to load user profile', err)
        setUser(null)
      })
    })

    return () => {
      if (unsubProfile) unsubProfile()
      unsub()
    }
  }, [])

  const value = useMemo<AuthState>(() => {
    if (isFirebaseMode()) {
      return {
        user,
        login: async ({ email, password }: LoginInput) => {
          const auth = getFirebaseAuth()
          try {
            await signInWithEmailAndPassword(auth, email, password)
          } catch (err: any) {
            const code = String(err?.code ?? '')
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
              throw new Error('Email atau password salah')
            }
            throw new Error('Login gagal')
          }
        },
        logout: () => {
          const auth = getFirebaseAuth()
          void signOut(auth)
          setUser(null)
        },
        hasRole: (roles: Role[]) => {
          if (!user) return false
          return roles.includes(user.role)
        },
        updateProfile: async (patch) => {
          if (!user) throw new Error('Silakan login terlebih dahulu')
          const auth = getFirebaseAuth()
          const fbUser = auth.currentUser
          if (!fbUser) throw new Error('Silakan login terlebih dahulu')

          const db = getFirestoreDb()
          const ref = doc(db, 'users', fbUser.uid)

          await updateDoc(ref, {
            name: patch.name,
            avatarDataUrl: patch.avatarDataUrl ?? '',
            updatedAt: isoNow(),
          } as any)

          setUser({ ...user, ...patch })
        },
        updatePassword: async ({ currentPassword, newPassword }) => {
          const auth = getFirebaseAuth()
          const fbUser = auth.currentUser
          if (!user || !fbUser || !fbUser.email) throw new Error('Silakan login terlebih dahulu')
          if (!newPassword || newPassword.trim().length < 6) throw new Error('Password baru minimal 6 karakter')

          try {
            const cred = EmailAuthProvider.credential(fbUser.email, currentPassword)
            await reauthenticateWithCredential(fbUser, cred)
            await fbUpdatePassword(fbUser, newPassword)
          } catch (err: any) {
            const code = String(err?.code ?? '')
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
              throw new Error('Password saat ini salah')
            }
            if (code === 'auth/requires-recent-login') {
              throw new Error('Silakan login ulang, lalu coba lagi')
            }
            throw new Error('Gagal mengubah password')
          }
        },
      }
    }

    return {
      user,
      login: async ({ email, password }: LoginInput) => {
        const match = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
        const passwords = loadPasswords()
        const expectedPassword = match ? (passwords[match.id] ?? match.password) : ''
        if (!match || expectedPassword !== password) {
          throw new Error('Email atau password salah')
        }

        const profiles = loadProfiles()
        const saved = profiles[match.id]
        const nextUser: User = {
          id: match.id,
          email: match.email,
          name: saved?.name ?? match.name,
          role: match.role,
          avatarDataUrl: saved?.avatarDataUrl,
        }
        setUser(nextUser)
        saveUser(nextUser)
      },
      logout: () => {
        setUser(null)
        saveUser(null)
      },
      hasRole: (roles: Role[]) => {
        if (!user) return false
        return roles.includes(user.role)
      },
      updateProfile: async (patch) => {
        if (!user) return
        const nextUser: User = { ...user, ...patch }
        setUser(nextUser)
        saveUser(nextUser)

        const profiles = loadProfiles()
        profiles[user.id] = { name: nextUser.name, avatarDataUrl: nextUser.avatarDataUrl }
        saveProfiles(profiles)
      },

      updatePassword: async ({ currentPassword, newPassword }) => {
        if (!user) throw new Error('Silakan login terlebih dahulu')
        const defaults = MOCK_USERS.find((u) => u.id === user.id)
        const passwords = loadPasswords()
        const expectedPassword = passwords[user.id] ?? defaults?.password ?? ''

        if (expectedPassword !== currentPassword) {
          throw new Error('Password saat ini salah')
        }
        if (!newPassword || newPassword.trim().length < 6) {
          throw new Error('Password baru minimal 6 karakter')
        }
        passwords[user.id] = newPassword
        savePasswords(passwords)
      },
    }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
