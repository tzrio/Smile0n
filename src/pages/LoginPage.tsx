import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string; reason?: string } }
  const logoUrl = `${import.meta.env.BASE_URL}smileon_logo.jpg`

  const isFirebaseMode = useMemo(() => {
    const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
    return raw === 'firebase'
  }, [])

  const redirectTo = useMemo(() => {
    return location.state?.from ?? '/app/dashboard'
  }, [location.state])

  const reason = location.state?.reason

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [user, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-screen-2xl items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
          <div>
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo perusahaan" className="h-10 w-10 rounded-md object-cover ring-1 ring-gray-200/70" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-900">Login Internal</h1>
                <p className="mt-1 text-sm text-gray-600">Akses hanya untuk karyawan (CEO / CTO / CMO).</p>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ceo@walldecor.local" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-900 ring-1 ring-gray-200/70">{error}</div>
            )}

            {reason && !error && (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-900 ring-1 ring-gray-200/70">{reason}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>

          {!isFirebaseMode && (
            <div className="mt-6 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200/70">
              <div className="text-xs font-semibold text-gray-700">Akun demo</div>
              <div className="mt-2 space-y-1 text-xs text-gray-700">
                <div>ceo@walldecor.local / admin123</div>
                <div>cto@walldecor.local / admin123</div>
                <div>cmo@walldecor.local / admin123</div>
              </div>
            </div>
          )}

          {isFirebaseMode && (
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => navigate('/signup')}
              >
                Daftar akun baru
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
