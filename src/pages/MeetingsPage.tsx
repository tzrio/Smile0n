/**
 * Rekap Rapat page:
 * - Create meeting recap (agenda, time, location, attendance, notes)
 * - List/filter + expand details
 * - Export CSV
 */
import { Fragment, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { EmptyState } from '../components/EmptyState'
import { Skeleton } from '../components/Skeleton'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import { useRepoMeta } from '../data/useRepoMeta'
import type { AttendanceStatus, MeetingAttendance } from '../data/types'
import { isoNow } from '../utils/date'
import { downloadCsv } from '../utils/csv'
import { useToast } from '../app/ToastContext'

type AttendanceRow = MeetingAttendance

function formatDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('id-ID', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function countAttendance(attendance: MeetingAttendance[]) {
  const counts = { HADIR: 0, IZIN: 0, ALPHA: 0 }
  for (const a of attendance) {
    if (a.status === 'IZIN') counts.IZIN += 1
    else if (a.status === 'ALPHA') counts.ALPHA += 1
    else counts.HADIR += 1
  }
  return counts
}

export function MeetingsPage() {
  const data = useAppData()
  const meta = useRepoMeta()
  const toast = useToast()

  const [title, setTitle] = useState('')
  const [activities, setActivities] = useState('')
  const [location, setLocation] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [notes, setNotes] = useState('')
  const [attendance, setAttendance] = useState<AttendanceRow[]>([{ name: '', status: 'HADIR' }])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [filterQuery, setFilterQuery] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const meetings = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    const fromIso = filterFrom ? new Date(filterFrom).toISOString() : ''
    const toIso = filterTo ? new Date(filterTo).toISOString() : ''

    return data.meetings
      .filter((m) => {
        if (q) {
          const hay = `${m.title} ${m.location} ${m.activities ?? ''} ${m.notes ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        if (fromIso && m.startAt < fromIso) return false
        if (toIso && m.startAt > toIso) return false
        return true
      })
      .slice()
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
  }, [data.meetings, filterFrom, filterQuery, filterTo])

  function updateAttendance(index: number, patch: Partial<AttendanceRow>) {
    setAttendance((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function addAttendanceRow() {
    setAttendance((prev) => [...prev, { name: '', status: 'HADIR' }])
  }

  function removeAttendanceRow(index: number) {
    setAttendance((prev) => prev.filter((_, i) => i !== index))
  }

  async function addMeeting() {
    setError(null)
    setSaving(true)
    try {
      if (!title.trim()) {
        setError('Judul rapat wajib diisi')
        return
      }
      if (!location.trim()) {
        setError('Lokasi wajib diisi')
        return
      }
      if (!startAt) {
        setError('Waktu mulai wajib diisi')
        return
      }

      const startIso = new Date(startAt).toISOString()
      const endIso = endAt ? new Date(endAt).toISOString() : undefined

      const cleanedAttendance = attendance
        .map((a) => ({ name: a.name.trim(), status: a.status }))
        .filter((a) => Boolean(a.name))

      if (cleanedAttendance.length === 0) {
        setError('Isi minimal 1 peserta (kehadiran)')
        return
      }

      await Promise.resolve(
        (repo as any).meetings.create({
          title: title.trim(),
          activities: activities.trim() ? activities.trim() : undefined,
          startAt: startIso,
          endAt: endIso,
          location: location.trim(),
          attendance: cleanedAttendance,
          notes: notes.trim() ? notes.trim() : undefined,
        })
      )

      setTitle('')
      setActivities('')
      setLocation('')
      setStartAt('')
      setEndAt('')
      setNotes('')
      setAttendance([{ name: '', status: 'HADIR' }])
      toast.success('Rekap rapat berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan rekap rapat'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeeting(id: string) {
    setError(null)
    setDeletingId(id)
    try {
      const ok = window.confirm('Hapus rekap rapat ini?')
      if (!ok) return
      await Promise.resolve((repo as any).meetings.remove(id))
      toast.success('Rekap rapat berhasil dihapus')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus rekap rapat'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  function exportMeetingsCsv() {
    const rows = meetings
    const filename = `rekap-rapat-${new Date(isoNow()).toISOString().slice(0, 10)}`

    downloadCsv(filename, rows, [
      { header: 'Waktu Mulai', value: (m) => m.startAt },
      { header: 'Waktu Selesai', value: (m) => m.endAt ?? '' },
      { header: 'Judul', value: (m) => m.title },
      { header: 'Lokasi', value: (m) => m.location },
      { header: 'Aktivitas', value: (m) => m.activities ?? '' },
      {
        header: 'Hadir',
        value: (m) => countAttendance(m.attendance).HADIR,
      },
      {
        header: 'Izin',
        value: (m) => countAttendance(m.attendance).IZIN,
      },
      {
        header: 'Alpha',
        value: (m) => countAttendance(m.attendance).ALPHA,
      },
      {
        header: 'Peserta (raw)',
        value: (m) => m.attendance.map((a) => `${a.name}:${a.status}`).join(' | '),
      },
      { header: 'Catatan', value: (m) => m.notes ?? '' },
      { header: 'CreatedAt', value: (m) => m.createdAt },
      { header: 'UpdatedAt', value: (m) => m.updatedAt },
    ])

    toast.success('CSV rekap rapat berhasil dibuat')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rekap Rapat"
        subtitle="Catat aktivitas, waktu pertemuan, lokasi, kehadiran, dan catatan hasil rapat."
        right={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={exportMeetingsCsv}
              disabled={meetings.length === 0}
              title={meetings.length === 0 ? 'Tidak ada data untuk diexport' : 'Export CSV'}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Tambah Rekap" description="Simpan rekap rapat terbaru agar mudah ditelusuri." right={<div className="text-xs text-gray-500">{data.meetings.length} total</div>}>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Judul rapat</div>
              <div className="mt-1">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Rapat Mingguan Tim" />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Aktivitas / Agenda</div>
              <div className="mt-1">
                <Input value={activities} onChange={(e) => setActivities(e.target.value)} placeholder="Contoh: Evaluasi penjualan, rencana produksi, stok" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waktu mulai</div>
                <div className="mt-1">
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Waktu selesai (opsional)</div>
                <div className="mt-1">
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Lokasi</div>
              <div className="mt-1">
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Contoh: Kantor / Zoom / Gudang" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Kehadiran</div>
                <Button variant="secondary" type="button" onClick={addAttendanceRow}>
                  + Peserta
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {attendance.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_160px_40px] md:items-center">
                    <Input
                      value={row.name}
                      onChange={(e) => updateAttendance(idx, { name: e.target.value })}
                      placeholder="Nama peserta"
                    />
                    <Select
                      value={row.status}
                      onChange={(e) => updateAttendance(idx, { status: e.target.value as AttendanceStatus })}
                    >
                      <option value="HADIR">Hadir</option>
                      <option value="IZIN">Izin</option>
                      <option value="ALPHA">Alpha</option>
                    </Select>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => removeAttendanceRow(idx)}
                      disabled={attendance.length <= 1}
                      title={attendance.length <= 1 ? 'Minimal 1 baris peserta' : 'Hapus baris'}
                      className="px-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Catatan</div>
              <div className="mt-1">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ringkasan keputusan / tindak lanjut" />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Button onClick={addMeeting} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Rekap'}
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Daftar Rekap" description="Cari dan lihat detail rekap rapat." right={<div className="flex items-center gap-2">
          <Input value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} placeholder="Cari judul/lokasi" className="w-[180px]" />
        </div>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Dari tanggal</div>
              <div className="mt-1">
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Sampai tanggal</div>
              <div className="mt-1">
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            {!meta.ready ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : meetings.length === 0 ? (
              <EmptyState
                title="Belum ada rekap rapat"
                description="Mulai dengan mengisi form di sebelah kiri. Setelah tersimpan, kamu bisa export ke CSV."
              />
            ) : (
              <Table headers={["Waktu", "Judul", "Lokasi", "Kehadiran", "Aksi"]}>
                {meetings.map((m) => {
                  const counts = countAttendance(m.attendance)
                  const expanded = Boolean(expandedIds[m.id])
                  return (
                    <Fragment key={m.id}>
                      <tr className="bg-white dark:bg-gray-900">
                        <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(m.startAt)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          <button
                            type="button"
                            className="text-left hover:underline"
                            onClick={() => setExpandedIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                          >
                            {m.title}
                          </button>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{m.location || '-'}</td>
                        <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {counts.HADIR}/{m.attendance.length}
                        </td>
                        <td className="px-5 py-3 text-sm">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setExpandedIds((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                            >
                              {expanded ? 'Tutup' : 'Detail'}
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => deleteMeeting(m.id)}
                              disabled={deletingId === m.id}
                            >
                              {deletingId === m.id ? 'Menghapus...' : 'Hapus'}
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="bg-gray-50 dark:bg-gray-950/40">
                          <td colSpan={5} className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Aktivitas</div>
                                <div className="mt-1 text-gray-800 dark:text-gray-100">{m.activities || '-'}</div>
                                <div className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Catatan</div>
                                <div className="mt-1 text-gray-800 dark:text-gray-100">{m.notes || '-'}</div>
                                <div className="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Waktu</div>
                                <div className="mt-1 text-gray-800 dark:text-gray-100">
                                  Mulai: {formatDateTime(m.startAt)}
                                  {m.endAt ? ` • Selesai: ${formatDateTime(m.endAt)}` : ''}
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Kehadiran</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-300">Hadir {counts.HADIR} • Izin {counts.IZIN} • Alpha {counts.ALPHA}</div>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-1">
                                  {m.attendance.map((a, i) => (
                                    <div key={`${a.name}-${i}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200/70 dark:bg-gray-900 dark:ring-white/10">
                                      <div className="font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
                                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300">{a.status}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
