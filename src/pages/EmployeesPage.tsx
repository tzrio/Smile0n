import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { useAuth } from '../auth/AuthContext'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import { doc, updateDoc } from 'firebase/firestore'
import { getFirestoreDb } from '../firebase/firebase'
import { isoNow } from '../utils/date'

export function EmployeesPage() {
  const data = useAppData()
  const auth = useAuth()
  const isFirebaseMode = useMemo(() => {
    const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
    return raw === 'firebase'
  }, [])

  const canCreateLocal = auth.hasRole(['CEO']) && !isFirebaseMode
  // Spark plan flow: CEO approves users by updating users/{uid}.role in Firestore.
  // (No Cloud Functions / custom claims required.)
  const canManageRolesFirebase = auth.hasRole(['CEO']) && isFirebaseMode

  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const employees = useMemo(() => data.employees, [data.employees])

  const [roleEdits, setRoleEdits] = useState<Record<string, 'CEO' | 'CTO' | 'CMO' | 'PENDING'>>({})
  const [roleLoading, setRoleLoading] = useState<Record<string, boolean>>({})

  function addEmployee() {
    setError(null)
    setSaved(false)
    try {
      if (!canCreateLocal) {
        setError('Hanya CEO yang bisa menambah karyawan')
        return
      }
      if (!name.trim() || !position.trim()) {
        setError('Nama dan jabatan wajib diisi')
        return
      }
      repo.employees.create({ name: name.trim(), position: position.trim() })
      setName('')
      setPosition('')
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambah karyawan')
    }
  }

  async function saveRole(uid: string) {
    setError(null)
    setSaved(false)
    if (!canManageRolesFirebase) {
      setError('Hanya CEO yang bisa mengubah role')
      return
    }

    if (auth.user?.id === uid) {
      setError('Demi keamanan, ubah role akun sendiri lewat Firebase Console saja.')
      return
    }

    const nextRole = roleEdits[uid]
    if (!nextRole) {
      setError('Role belum dipilih')
      return
    }

    setRoleLoading((m) => ({ ...m, [uid]: true }))
    try {
      const db = getFirestoreDb()
      await updateDoc(doc(db, 'users', uid), { role: nextRole, updatedAt: isoNow() } as any)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengubah role')
    } finally {
      setRoleLoading((m) => ({ ...m, [uid]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Profil Karyawan" subtitle="Kelola nama dan jabatan karyawan." />

      <Card title="Tambah Karyawan">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-gray-700">Nama</div>
            <div className="mt-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama karyawan"
                disabled={isFirebaseMode ? true : !canCreateLocal}
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Jabatan</div>
            <div className="mt-1">
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Jabatan"
                disabled={isFirebaseMode ? true : !canCreateLocal}
              />
            </div>
          </div>

          {isFirebaseMode ? (
            <div className="flex items-end">
              <Button type="button" className="w-full" disabled>
                Di Firebase, user daftar via halaman Signup
              </Button>
            </div>
          ) : (
            <div className="flex items-end">
              <Button type="button" onClick={addEmployee} className="w-full" disabled={!canCreateLocal}>
                Simpan
              </Button>
            </div>
          )}
        </div>

        {isFirebaseMode && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">
            Mode Firebase (Spark): user membuat akun lewat halaman Signup, lalu CEO meng-approve role di tabel bawah.
          </div>
        )}

        {!isFirebaseMode && !canCreateLocal && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">
            Hanya CEO yang bisa menambah karyawan.
          </div>
        )}

        {saved && <div className="mt-3 text-sm font-medium text-gray-700">Tersimpan.</div>}
        {error && <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}
      </Card>

      <Card title="Daftar Karyawan" description="Data siap diintegrasikan ke API / database.">
        <Table
          headers={
            isFirebaseMode
              ? auth.hasRole(['CEO'])
                ? ['Nama', 'Jabatan', 'ID', 'Role', 'Aksi']
                : ['Nama', 'Jabatan', 'ID', 'Role']
              : ['Nama', 'Jabatan', 'ID']
          }
        >
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 text-gray-900">{e.name}</td>
              <td className="px-5 py-3 text-gray-700">{e.position}</td>
              <td className="px-5 py-3 font-mono text-xs text-gray-600">{e.id}</td>

              {isFirebaseMode && (
                <>
                  <td className="px-5 py-3">
                    {auth.hasRole(['CEO']) ? (
                      <Select
                        value={roleEdits[e.id] ?? (((e as any).role as any) ?? 'PENDING')}
                        onChange={(ev) => setRoleEdits((m) => ({ ...m, [e.id]: ev.target.value as any }))}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CEO">CEO</option>
                        <option value="CTO">CTO</option>
                        <option value="CMO">CMO</option>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-700">{String((e as any).role ?? 'PENDING')}</div>
                    )}
                  </td>

                  {auth.hasRole(['CEO']) && (
                    <td className="px-5 py-3">
                      <Button
                        type="button"
                        className="px-2 py-1 text-xs"
                        onClick={() => void saveRole(e.id)}
                        disabled={!!roleLoading[e.id]}
                      >
                        {roleLoading[e.id] ? '...' : 'Simpan'}
                      </Button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  )
}
