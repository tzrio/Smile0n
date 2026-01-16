import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

initializeApp()

type Role = 'CEO' | 'CTO' | 'CMO'

function normalizeRole(value: unknown): Role {
  const raw = String(value ?? '')
  if (raw === 'CEO' || raw === 'CTO' || raw === 'CMO') return raw
  throw new HttpsError('invalid-argument', 'Role tidak valid')
}

async function assertCallerIsCEO(callerUid: string): Promise<void> {
  const db = getFirestore()
  const snap = await db.collection('users').doc(callerUid).get()
  const role = String(snap.data()?.role ?? '')
  if (role !== 'CEO') {
    throw new HttpsError('permission-denied', 'Hanya CEO yang boleh melakukan aksi ini')
  }
}

export const createUser = onCall(async (req) => {
  const callerUid = req.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Harus login')

  // Prioritaskan custom claim jika sudah ada, fallback ke users/{uid}.role
  const claimRole = (req.auth?.token as any)?.role
  if (claimRole === 'CEO') {
    // ok
  } else {
    await assertCallerIsCEO(callerUid)
  }

  const email = String((req.data as any)?.email ?? '').trim().toLowerCase()
  const password = String((req.data as any)?.password ?? '')
  const name = String((req.data as any)?.name ?? '').trim()
  const position = String((req.data as any)?.position ?? '').trim()
  const role = normalizeRole((req.data as any)?.role)

  if (!email || !email.includes('@')) throw new HttpsError('invalid-argument', 'Email tidak valid')
  if (!password || password.length < 6) throw new HttpsError('invalid-argument', 'Password minimal 6 karakter')
  if (!name) throw new HttpsError('invalid-argument', 'Nama wajib diisi')

  const adminAuth = getAuth()
  const db = getFirestore()

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    await adminAuth.setCustomUserClaims(userRecord.uid, { role })

    await db
      .collection('users')
      .doc(userRecord.uid)
      .set(
        {
          email,
          name,
          role,
          position,
          avatarDataUrl: '',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )

    return { uid: userRecord.uid }
  } catch (err: any) {
    const code = String(err?.code ?? '')
    if (code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Email sudah terdaftar')
    }
    throw new HttpsError('internal', 'Gagal membuat user')
  }
})

export const setUserRole = onCall(async (req) => {
  const callerUid = req.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Harus login')

  // Prioritaskan custom claim jika sudah ada, fallback ke users/{uid}.role
  const claimRole = (req.auth?.token as any)?.role
  if (claimRole === 'CEO') {
    // ok
  } else {
    await assertCallerIsCEO(callerUid)
  }

  const targetUid = String((req.data as any)?.uid ?? '').trim()
  const nextRole = normalizeRole((req.data as any)?.role)
  if (!targetUid) throw new HttpsError('invalid-argument', 'uid wajib diisi')

  const adminAuth = getAuth()
  const db = getFirestore()

  // Merge existing custom claims
  const userRecord = await adminAuth.getUser(targetUid)
  const existing = (userRecord.customClaims ?? {}) as Record<string, unknown>
  await adminAuth.setCustomUserClaims(targetUid, { ...existing, role: nextRole })

  await db
    .collection('users')
    .doc(targetUid)
    .set(
      {
        role: nextRole,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

  return { uid: targetUid, role: nextRole }
})
