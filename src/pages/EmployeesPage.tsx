/**
 * Employees page:
 * - In Firebase mode: CEO approves roles (PENDING → CEO/CTO/CMO)
 * - In Local mode: edit employee position
 */
import { useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../auth/AuthContext'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import { doc, updateDoc } from 'firebase/firestore'
import { getFirestoreDb } from '../firebase/firebase'
import { isoNow } from '../utils/date'
import { useToast } from '../app/ToastContext'

export function EmployeesPage() {
  const data = useAppData()
  const auth = useAuth()
  const toast = useToast()
  const isFirebaseMode = useMemo(() => {
    const raw = ((import.meta as any).env?.VITE_DATA_SOURCE as string | undefined) ?? 'local'
    return raw === 'firebase'
  }, [])

  // Spark plan flow: CEO approves users by updating users/{uid}.role in Firestore.
  // (No Cloud Functions / custom claims required.)
  const canManageEmployeesFirebase = auth.hasRole(['CEO']) && isFirebaseMode
  const canEditEmployeePositionLocal = auth.hasRole(['CEO']) && !isFirebaseMode
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const employees = useMemo(() => data.employees, [data.employees])

  const [roleEdits, setRoleEdits] = useState<Record<string, 'CEO' | 'CTO' | 'CMO' | 'PENDING'>>({})
  const [positionEdits, setPositionEdits] = useState<Record<string, string>>({})
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})

  async function saveEmployee(uid: string) {
    setError(null)
    setSaved(false)
    if (!canManageEmployeesFirebase) {
      setError('Hanya CEO yang bisa mengubah data karyawan')
      return
    }

    const nextRole = roleEdits[uid]
    const nextPosition = (positionEdits[uid] ?? '').trim()

    if (nextRole && auth.user?.id === uid) {
      setError('Demi keamanan, ubah role akun sendiri lewat Firebase Console saja.')
      return
    }

    if (!nextRole && !nextPosition) {
      setError('Tidak ada perubahan untuk disimpan')
      return
    }

    setRowLoading((m) => ({ ...m, [uid]: true }))
    try {
      const db = getFirestoreDb()
      const patch: any = { updatedAt: isoNow() }
      if (nextRole) patch.role = nextRole
      if (nextPosition) patch.position = nextPosition
      await updateDoc(doc(db, 'users', uid), patch)
      setSaved(true)
      toast.success('Data karyawan berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan data karyawan'
      setError(msg)
      toast.error(msg)
    } finally {
      setRowLoading((m) => ({ ...m, [uid]: false }))
    }
  }

  function savePositionLocal(id: string) {
    setError(null)
    setSaved(false)
    if (!canEditEmployeePositionLocal) {
      setError('Hanya CEO yang bisa mengubah jabatan')
      return
    }

    const nextPosition = (positionEdits[id] ?? '').trim()
    if (!nextPosition) {
      setError('Jabatan wajib diisi')
      return
    }

    try {
      ;(repo as any).employees.update(id, { position: nextPosition })
      setSaved(true)
      toast.success('Jabatan berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan jabatan'
      setError(msg)
      toast.error(msg)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Profil Karyawan" subtitle="Kelola nama dan jabatan karyawan." />

      <Card title="Daftar Karyawan" description="Data siap diintegrasikan ke API / database.">
        {saved && <div className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Tersimpan.</div>}
        {error && (
          <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-100">
            {error}
          </div>
        )}

        {employees.length === 0 ? (
          <EmptyState
            title="Belum ada data karyawan"
            description={
              isFirebaseMode
                ? 'Di mode Firebase, user membuat akun lewat halaman Signup lalu CEO meng-approve role di sini.'
                : 'Belum ada data karyawan di mode local.'
            }
          />
        ) : (
        <Table
          headers={
            isFirebaseMode
              ? auth.hasRole(['CEO'])
                ? ['Nama', 'Jabatan', 'ID', 'Role', 'Aksi']
                : ['Nama', 'Jabatan', 'ID', 'Role']
              : canEditEmployeePositionLocal
                ? ['Nama', 'Jabatan', 'ID', 'Aksi']
                : ['Nama', 'Jabatan', 'ID']
          }
        >
          {employees.map((e) => (
            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
              <td className="px-5 py-3 text-gray-900 dark:text-gray-100">{e.name}</td>
              <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                {isFirebaseMode && auth.hasRole(['CEO']) ? (
                  <Input
                    value={positionEdits[e.id] ?? e.position}
                    onChange={(ev) => setPositionEdits((m) => ({ ...m, [e.id]: ev.target.value }))}
                    placeholder="Jabatan"
                  />
                ) : !isFirebaseMode && canEditEmployeePositionLocal ? (
                  <Input
                    value={positionEdits[e.id] ?? e.position}
                    onChange={(ev) => setPositionEdits((m) => ({ ...m, [e.id]: ev.target.value }))}
                    placeholder="Jabatan"
                  />
                ) : (
                  e.position
                )}
              </td>
              <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{e.id}</td>

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
                      <div className="text-sm text-gray-700 dark:text-gray-300">{String((e as any).role ?? 'PENDING')}</div>
                    )}
                  </td>

                  {auth.hasRole(['CEO']) && (
                    <td className="px-5 py-3">
                      <Button
                        type="button"
                        className="px-2 py-1 text-xs"
                        onClick={() => void saveEmployee(e.id)}
                        disabled={!!rowLoading[e.id]}
                      >
                        {rowLoading[e.id] ? '...' : 'Simpan'}
                      </Button>
                    </td>
                  )}
                </>
              )}

              {!isFirebaseMode && canEditEmployeePositionLocal && (
                <td className="px-5 py-3">
                  <Button type="button" className="px-2 py-1 text-xs" onClick={() => savePositionLocal(e.id)}>
                    Simpan
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </Table>
        )}
      </Card>
    </div>
  )
}
