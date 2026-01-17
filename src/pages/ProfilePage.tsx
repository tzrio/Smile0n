/**
 * Profile page:
 * - Update name/avatar
 * - Change password
 */
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { useToast } from '../app/ToastContext'

function initialsFromName(name: string) {
  const parts = name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'U'
}

export function ProfilePage() {
  const { user, updateProfile, updatePassword } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(user?.avatarDataUrl)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const initials = useMemo(() => initialsFromName(user?.name ?? ''), [user?.name])

  async function onPickFile(file: File | null) {
    setError(null)
    setSaved(false)
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar')
      return
    }

    // keep localStorage from exploding; this is just a simple internal demo
    const maxBytes = 1_000_000
    if (file.size > maxBytes) {
      setError('Ukuran gambar terlalu besar (maks 1MB)')
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })

    setAvatarDataUrl(dataUrl)
  }

  async function onSave() {
    setError(null)
    setSaved(false)
    setPasswordSaved(false)

    if (!user) {
      setError('Silakan login terlebih dahulu')
      return
    }

    const nextName = name.trim()
    if (!nextName) {
      setError('Nama wajib diisi')
      return
    }

    try {
      await updateProfile({ name: nextName, avatarDataUrl })
      setSaved(true)
      toast.success('Profil berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan profil'
      setError(msg)
      toast.error(msg)
    }
  }

  async function onSavePassword() {
    setError(null)
    setSaved(false)
    setPasswordSaved(false)

    if (!currentPassword) {
      setError('Password saat ini wajib diisi')
      return
    }
    if (!newPassword) {
      setError('Password baru wajib diisi')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak sama')
      return
    }

    try {
      await updatePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSaved(true)
      toast.success('Password berhasil diubah')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengubah password'
      setError(msg)
      toast.error(msg)
    }
  }


  return (
    <div className="space-y-6">
      <PageHeader title="Profil" subtitle="Edit nama dan foto profil." />

      <Card title="Akun">
        <div className="flex items-center gap-4">
          {avatarDataUrl ? (
            <img
              src={avatarDataUrl}
              alt="Foto profil"
              className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200 dark:ring-white/10"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-100 dark:ring-white/10">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{user?.email}</div>
            <div className="mt-1 text-xs font-semibold text-gray-700 dark:text-gray-300">Role: {user?.role}</div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Nama</div>
            <div className="mt-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Foto Profil</div>
            <div className="mt-1">
              <Input type="file" accept="image/*" onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">PNG/JPG maks 1MB.</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={onSave}>
            Simpan Profil
          </Button>
          {saved && <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Tersimpan.</div>}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-100">
            {error}
          </div>
        )}
      </Card>

      <Card title="Keamanan" description="Ubah kata sandi login.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Password Saat Ini</div>
            <div className="mt-1">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Password Baru</div>
            <div className="mt-1">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password Baru</div>
            <div className="mt-1">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={onSavePassword}>
            Simpan Password
          </Button>
          {passwordSaved && <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Password berhasil diubah.</div>}
        </div>
      </Card>

    </div>
  )
}
