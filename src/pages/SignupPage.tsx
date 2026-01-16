import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { getFirebaseAuth, getFirestoreDb } from '../firebase/firebase'
import { isoNow } from '../utils/date'

export function SignupPage() {
  const navigate = useNavigate()
  const logoUrl = `${import.meta.env.BASE_URL}smileon_logo.jpg`

  const isFirebaseMode = useMemo(() => {
    const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
    return raw === 'firebase'
  }, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!isFirebaseMode) {
      navigate('/login', { replace: true })
    }
  }, [isFirebaseMode, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    setLoading(true)

    try {
      const nextName = name.trim()
      const nextEmail = email.trim().toLowerCase()

      if (!nextName) throw new Error('Nama wajib diisi')
      if (!nextEmail || !nextEmail.includes('@')) throw new Error('Email tidak valid')
      if (!password || password.length < 6) throw new Error('Password minimal 6 karakter')

      const auth = getFirebaseAuth()
      const cred = await createUserWithEmailAndPassword(auth, nextEmail, password)
      await updateProfile(cred.user, { displayName: nextName })

      // Spark flow: pastikan ada dokumen users/{uid} supaya CEO bisa lihat & approve.
      // Ini juga mencegah kondisi di mana kita logout terlalu cepat sebelum AuthContext sempat membuat doc.
      const db = getFirestoreDb()
      const now = isoNow()
      await setDoc(
        doc(db, 'users', cred.user.uid),
        {
          email: nextEmail,
          name: nextName,
          role: 'PENDING',
          position: '',
          avatarDataUrl: '',
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      )

      // Karena role default = PENDING, user tidak bisa masuk ke app sebelum di-approve.
      // Supaya UX tidak "loncat" ke app lalu logout lagi, kita logout setelah signup.
      await signOut(auth)

      setDone(true)
      // User akan otomatis login, lalu role default PENDING sampai di-approve CEO
      navigate('/login', { replace: true, state: { reason: 'Akun berhasil dibuat. Tunggu CEO mengaktifkan role kamu.' } })
    } catch (err: any) {
      const code = String(err?.code ?? '')
      if (code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar')
      } else {
        setError(err instanceof Error ? err.message : 'Gagal daftar')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isFirebaseMode) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
          <div>
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo perusahaan" className="h-10 w-10 rounded-md object-cover ring-1 ring-gray-200/70" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">Daftar Akun</h1>
                <p className="mt-1 text-sm text-gray-600">Akun akan berstatus pending sampai disetujui CEO.</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Nama</label>
              <div className="mt-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@perusahaan.com" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 6 karakter" />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-900 ring-1 ring-gray-200/70">{error}</div>
            )}

            {done && <div className="text-sm font-medium text-gray-700">Akun dibuat.</div>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
              onClick={() => navigate('/login')}
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
