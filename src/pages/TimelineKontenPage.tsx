import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Skeleton } from '../components/Skeleton'
import { useToast } from '../app/ToastContext'
import { useAppData } from '../data/useAppData'
import { useRepoMeta } from '../data/useRepoMeta'
import { repo } from '../data/repository'
import type { ContentSchedule, ContentScheduleCalendarConfig, ContentScheduleColumn, ContentScheduleRow } from '../data/types'
import { createId } from '../utils/id'

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

type Draft = {
  id: string
  title: string
  columns: ContentScheduleColumn[]
  rows: ContentScheduleRow[]
  calendarConfig?: ContentScheduleCalendarConfig
}

type CalendarItem = {
  dateKey: string
  timeLabel: string
  title: string
  status: string
  rowId: string
}

function cloneSchedule(s: ContentSchedule): Draft {
  return {
    id: s.id,
    title: s.title,
    columns: s.columns.map((c) => ({ ...c })),
    rows: s.rows.map((r) => ({ id: r.id, values: { ...r.values } })),
    calendarConfig: s.calendarConfig ? { ...s.calendarConfig } : undefined,
  }
}

function buildDefaultSchedule(): Omit<ContentSchedule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: 'Timeline Konten April 2026',
    columns: [
      { id: 'col-week', label: 'Minggu' },
      { id: 'col-post', label: 'Post' },
      { id: 'col-date', label: 'Tanggal' },
      { id: 'col-day', label: 'Hari' },
      { id: 'col-time', label: 'Jam' },
      { id: 'col-tools', label: 'Tools' },
      { id: 'col-type', label: 'Jenis' },
      { id: 'col-idea', label: 'Ide' },
      { id: 'col-status', label: 'Status' },
    ],
    rows: [
      {
        id: 'ROW-001',
        values: {
          'col-week': 'Minggu 1',
          'col-post': '1',
          'col-date': '2026-04-04',
          'col-day': 'Sabtu',
          'col-time': '20:00',
          'col-tools': 'Canva',
          'col-type': 'Tutorial',
          'col-idea': 'Gradient aesthetic basic',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-002',
        values: {
          'col-week': 'Minggu 1',
          'col-post': '2',
          'col-date': '2026-04-05',
          'col-day': 'Minggu',
          'col-time': '19:30',
          'col-tools': 'Figma',
          'col-type': 'Tutorial',
          'col-idea': 'Button UI simple',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-003',
        values: {
          'col-week': 'Minggu 2',
          'col-post': '3',
          'col-date': '2026-04-11',
          'col-day': 'Sabtu',
          'col-time': '20:00',
          'col-tools': 'Canva',
          'col-type': 'Recreate',
          'col-idea': 'Poster Islami improve',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-004',
        values: {
          'col-week': 'Minggu 2',
          'col-post': '4',
          'col-date': '2026-04-12',
          'col-day': 'Minggu',
          'col-time': '19:30',
          'col-tools': 'Figma',
          'col-type': 'Edukasi',
          'col-idea': '3 kesalahan UI pemula',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-005',
        values: {
          'col-week': 'Minggu 3',
          'col-post': '5',
          'col-date': '2026-04-18',
          'col-day': 'Sabtu',
          'col-time': '20:00',
          'col-tools': 'Canva',
          'col-type': 'Original',
          'col-idea': 'Poster kopi kekinian',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-006',
        values: {
          'col-week': 'Minggu 3',
          'col-post': '6',
          'col-date': '2026-04-19',
          'col-day': 'Minggu',
          'col-time': '19:30',
          'col-tools': 'Figma',
          'col-type': 'Tutorial',
          'col-idea': 'Card UI clean',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-007',
        values: {
          'col-week': 'Minggu 4',
          'col-post': '7',
          'col-date': '2026-04-25',
          'col-day': 'Sabtu',
          'col-time': '20:00',
          'col-tools': 'Canva',
          'col-type': 'Improve',
          'col-idea': 'Fix desain jelek',
          'col-status': 'Belum upload',
        },
      },
      {
        id: 'ROW-008',
        values: {
          'col-week': 'Minggu 4',
          'col-post': '8',
          'col-date': '2026-04-26',
          'col-day': 'Minggu',
          'col-time': '19:30',
          'col-tools': 'Canva',
          'col-type': 'Soft Sell',
          'col-idea': 'Template UMKM',
          'col-status': 'Belum upload',
        },
      },
    ],
    calendarConfig: {
      dateColumnId: 'col-date',
      timeColumnId: 'col-time',
      titleColumnId: 'col-idea',
      statusColumnId: 'col-status',
    },
  }
}

function pad2(n: number) {
  return `${n}`.padStart(2, '0')
}

function dateKeyFromParts(year: number, monthIndex: number, day: number) {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`
}

function parseDateKey(value: string): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return null
}

function parseTime(value: string): string {
  if (!value) return ''
  if (/^\d{2}:\d{2}$/.test(value)) return value
  return value
}

function buildCalendarDays(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7
  const days: Array<number | null> = []
  for (let i = 0; i < offset; i += 1) days.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) days.push(d)
  return days
}

export function TimelineKontenPage() {
  const data = useAppData()
  const meta = useRepoMeta()
  const toast = useToast()

  const schedules = data.contentSchedules
  const [selectedId, setSelectedId] = useState(schedules[0]?.id ?? '')

  const selected = useMemo(
    () => schedules.find((s) => s.id === selectedId) ?? schedules[0] ?? null,
    [schedules, selectedId]
  )

  const [draft, setDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    if (!selected) {
      setDraft(null)
      setDirty(false)
      return
    }
    if (dirty) return
    setDraft(cloneSchedule(selected))
  }, [selected?.id, selected?.updatedAt, dirty])

  useEffect(() => {
    if (!selected) return
    if (!selected.calendarConfig?.dateColumnId) return
    const dateCol = selected.calendarConfig.dateColumnId
    const firstValid = selected.rows
      .map((r) => parseDateKey(r.values[dateCol] ?? ''))
      .find(Boolean)
    if (!firstValid) return
    const parsed = new Date(`${firstValid}T00:00:00`)
    if (!Number.isNaN(parsed.getTime())) {
      setCalendarMonth(parsed.getMonth())
      setCalendarYear(parsed.getFullYear())
    }
  }, [selected?.id, selected?.calendarConfig?.dateColumnId])

  useEffect(() => {
    if (!selectedId && schedules[0]) {
      setSelectedId(schedules[0].id)
    }
  }, [schedules, selectedId])

  const columns = draft?.columns ?? []
  const rows = draft?.rows ?? []
  const calendarConfig = draft?.calendarConfig

  const dateColumnId = calendarConfig?.dateColumnId
  const timeColumnId = calendarConfig?.timeColumnId
  const titleColumnId = calendarConfig?.titleColumnId
  const statusColumnId = calendarConfig?.statusColumnId

  const invalidDateCount = useMemo(() => {
    if (!dateColumnId) return 0
    return rows.filter((r) => {
      const v = r.values[dateColumnId] ?? ''
      return v.trim() !== '' && !parseDateKey(v)
    }).length
  }, [rows, dateColumnId])

  const calendarItems = useMemo(() => {
    if (!dateColumnId) return [] as CalendarItem[]
    const items: CalendarItem[] = []
    for (const row of rows) {
      const dateValue = parseDateKey(row.values[dateColumnId] ?? '')
      if (!dateValue) continue
      const timeValue = timeColumnId ? row.values[timeColumnId] ?? '' : ''
      const titleValue = titleColumnId ? row.values[titleColumnId] ?? '' : ''
      const statusValue = statusColumnId ? row.values[statusColumnId] ?? '' : ''
      items.push({
        dateKey: dateValue,
        timeLabel: parseTime(timeValue),
        title: titleValue || '(Tanpa judul)',
        status: statusValue,
        rowId: row.id,
      })
    }
    return items
  }, [rows, dateColumnId, timeColumnId, titleColumnId, statusColumnId])

  const calendarMap = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of calendarItems) {
      const list = map.get(item.dateKey) ?? []
      list.push(item)
      map.set(item.dateKey, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel))
    }
    return map
  }, [calendarItems])

  const calendarDays = useMemo(() => buildCalendarDays(calendarYear, calendarMonth), [calendarYear, calendarMonth])

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    const years = []
    for (let y = current - 2; y <= current + 3; y += 1) years.push(y)
    return years
  }, [])

  function markDirty(next: Draft) {
    setDraft(next)
    setDirty(true)
  }

  function updateTitle(value: string) {
    if (!draft) return
    markDirty({ ...draft, title: value })
  }

  function updateColumnLabel(id: string, label: string) {
    if (!draft) return
    const nextColumns = draft.columns.map((c) => (c.id === id ? { ...c, label } : c))
    markDirty({ ...draft, columns: nextColumns })
  }

  function addColumn() {
    if (!draft) return
    const id = createId('col')
    const nextColumns = [...draft.columns, { id, label: 'Kolom Baru' }]
    const nextRows = draft.rows.map((r) => ({
      ...r,
      values: { ...r.values, [id]: '' },
    }))
    markDirty({ ...draft, columns: nextColumns, rows: nextRows })
  }

  function removeColumn(id: string) {
    if (!draft) return
    const nextColumns = draft.columns.filter((c) => c.id !== id)
    const nextRows = draft.rows.map((r) => {
      const nextValues = { ...r.values }
      delete nextValues[id]
      return { ...r, values: nextValues }
    })
    const nextCalendar: ContentScheduleCalendarConfig = { ...draft.calendarConfig }
    if (nextCalendar.dateColumnId === id) nextCalendar.dateColumnId = undefined
    if (nextCalendar.timeColumnId === id) nextCalendar.timeColumnId = undefined
    if (nextCalendar.titleColumnId === id) nextCalendar.titleColumnId = undefined
    if (nextCalendar.statusColumnId === id) nextCalendar.statusColumnId = undefined
    markDirty({ ...draft, columns: nextColumns, rows: nextRows, calendarConfig: nextCalendar })
  }

  function addRow() {
    if (!draft) return
    const newRow: ContentScheduleRow = {
      id: createId('row'),
      values: draft.columns.reduce((acc, c) => ({ ...acc, [c.id]: '' }), {} as Record<string, string>),
    }
    markDirty({ ...draft, rows: [newRow, ...draft.rows] })
  }

  function removeRow(id: string) {
    if (!draft) return
    markDirty({ ...draft, rows: draft.rows.filter((r) => r.id !== id) })
  }

  function updateCell(rowId: string, columnId: string, value: string) {
    if (!draft) return
    const nextRows = draft.rows.map((r) => {
      if (r.id !== rowId) return r
      return { ...r, values: { ...r.values, [columnId]: value } }
    })
    markDirty({ ...draft, rows: nextRows })
  }

  function updateCalendarConfig(patch: Partial<ContentScheduleCalendarConfig>) {
    if (!draft) return
    markDirty({ ...draft, calendarConfig: { ...(draft.calendarConfig ?? {}), ...patch } })
  }

  async function saveChanges() {
    if (!draft || !selected) return
    setError(null)
    setSaving(true)
    try {
      if (!draft.title.trim()) {
        setError('Judul timeline wajib diisi')
        return
      }
      await Promise.resolve(
        (repo as any).contentSchedules.update(selected.id, {
          title: draft.title.trim(),
          columns: draft.columns,
          rows: draft.rows,
          calendarConfig: draft.calendarConfig,
        })
      )
      setDirty(false)
      toast.success('Timeline konten berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan timeline konten'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  function discardChanges() {
    if (!selected) return
    setDraft(cloneSchedule(selected))
    setDirty(false)
    setError(null)
  }

  async function createSchedule() {
    setError(null)
    setSaving(true)
    try {
      const base = buildDefaultSchedule()
      const created = await Promise.resolve((repo as any).contentSchedules.create(base))
      setSelectedId(created.id)
      toast.success('Timeline konten baru dibuat')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal membuat timeline konten'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!meta.ready) {
    return (
      <div className="space-y-6">
        <PageHeader title="Timeline Konten" subtitle="Kelola jadwal konten dan kalender bulanan." />
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </Card>
      </div>
    )
  }

  if (!selected || !draft) {
    return (
      <div className="space-y-6">
        <PageHeader title="Timeline Konten" subtitle="Kelola jadwal konten dan kalender bulanan." />
        <EmptyState
          title="Belum ada timeline konten"
          description="Buat timeline pertama agar jadwal dan kalender konten bisa dikelola bersama."
          action={
            <Button onClick={createSchedule} disabled={saving}>
              Buat timeline
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline Konten"
        subtitle="Kelola jadwal konten, status upload, dan tampilan kalender bulanan."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={discardChanges} disabled={!dirty || saving}>
              Batal
            </Button>
            <Button onClick={saveChanges} disabled={!dirty || saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card title="Timeline aktif" description="Pilih dan ubah timeline yang ingin dikelola.">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pilih timeline</label>
            <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={createSchedule} disabled={saving}>
              Timeline baru
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Judul timeline</label>
          <Input value={draft.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Judul timeline" />
        </div>

        {dirty && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Ada perubahan belum disimpan.
          </div>
        )}
      </Card>

      <Card
        title="Kolom tabel"
        description="Ubah judul kolom sesuai kebutuhan. Kolom tanggal & jam dipakai untuk kalender."
        right={
          <Button variant="secondary" onClick={addColumn}>
            Tambah kolom
          </Button>
        }
      >
        <div className="space-y-3">
          {columns.map((c) => (
            <div key={c.id} className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
              <Input value={c.label} onChange={(e) => updateColumnLabel(c.id, e.target.value)} />
              <Button variant="danger" onClick={() => removeColumn(c.id)}>
                Hapus
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Konfigurasi kalender" description="Pilih kolom mana yang dipakai untuk kalender bulanan.">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kolom tanggal</label>
            <Select
              value={dateColumnId ?? ''}
              onChange={(e) => updateCalendarConfig({ dateColumnId: e.target.value || undefined })}
            >
              <option value="">- Pilih -</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
            <div className="mt-1 text-xs text-gray-500">Format tanggal: YYYY-MM-DD.</div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kolom jam</label>
            <Select
              value={timeColumnId ?? ''}
              onChange={(e) => updateCalendarConfig({ timeColumnId: e.target.value || undefined })}
            >
              <option value="">- Pilih -</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kolom judul</label>
            <Select
              value={titleColumnId ?? ''}
              onChange={(e) => updateCalendarConfig({ titleColumnId: e.target.value || undefined })}
            >
              <option value="">- Pilih -</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Kolom status</label>
            <Select
              value={statusColumnId ?? ''}
              onChange={(e) => updateCalendarConfig({ statusColumnId: e.target.value || undefined })}
            >
              <option value="">- Pilih -</option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {invalidDateCount > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {invalidDateCount} baris memiliki format tanggal tidak valid. Gunakan format YYYY-MM-DD.
          </div>
        )}
      </Card>

      <Card
        title="Tabel timeline"
        description="Edit isi jadwal, status upload, dan informasi lainnya."
        right={
          <Button variant="secondary" onClick={addRow}>
            Tambah baris
          </Button>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-gray-200/70 dark:border-white/10">
          <table className="min-w-full divide-y divide-gray-200/70 text-sm dark:divide-white/10">
            <thead className="bg-gray-50 dark:bg-gray-950/40">
              <tr>
                {columns.map((c) => (
                  <th key={c.id} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/70 dark:divide-white/10">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-sm text-gray-500">
                    Belum ada baris. Tambahkan baris baru untuk mulai mengisi timeline.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    {columns.map((c) => {
                      const value = r.values[c.id] ?? ''
                      const isDate = c.id === dateColumnId
                      const isTime = c.id === timeColumnId
                      const isStatus = c.id === statusColumnId

                      if (isStatus) {
                        return (
                          <td key={c.id} className="px-4 py-3">
                            <Select value={value} onChange={(e) => updateCell(r.id, c.id, e.target.value)}>
                              <option value="">- Pilih -</option>
                              <option value="Belum upload">Belum upload</option>
                              <option value="Sudah upload">Sudah upload</option>
                            </Select>
                          </td>
                        )
                      }

                      return (
                        <td key={c.id} className="px-4 py-3">
                          <Input
                            type={isDate ? 'date' : isTime ? 'time' : 'text'}
                            value={value}
                            onChange={(e) => updateCell(r.id, c.id, e.target.value)}
                            placeholder={isDate ? 'YYYY-MM-DD' : ''}
                          />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3">
                      <Button variant="danger" onClick={() => removeRow(r.id)}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Kalender konten" description="Tampilan kalender dari data di tabel.">
        {!dateColumnId ? (
          <EmptyState
            title="Kolom tanggal belum dipilih"
            description="Pilih kolom tanggal di konfigurasi kalender untuk menampilkan jadwal di kalender."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[160px_160px_auto] md:items-end">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Bulan</label>
                <Select value={`${calendarMonth}`} onChange={(e) => setCalendarMonth(Number(e.target.value))}>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tahun</label>
                <Select value={`${calendarYear}`} onChange={(e) => setCalendarYear(Number(e.target.value))}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="text-xs text-gray-500">
                Total event bulan ini: {calendarItems.filter((i) => i.dateKey.startsWith(`${calendarYear}-${pad2(calendarMonth + 1)}`)).length}
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="min-h-[110px] rounded-lg bg-gray-50 dark:bg-gray-950/40" />
                }
                const dateKey = dateKeyFromParts(calendarYear, calendarMonth, day)
                const items = calendarMap.get(dateKey) ?? []
                const todayKey = parseDateKey(new Date().toISOString().slice(0, 10))
                const isToday = todayKey === dateKey

                return (
                  <div key={dateKey} className="min-h-[110px] rounded-lg border border-gray-200/70 bg-white p-2 text-xs shadow-sm dark:border-white/10 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div className={[
                        'text-xs font-semibold',
                        isToday ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-200',
                      ].join(' ')}>
                        {day}
                      </div>
                      {items.length > 0 && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      {items.map((item) => (
                        <div key={item.rowId} className="rounded-md border border-gray-200/60 bg-gray-50 px-2 py-1 text-[11px] text-gray-700 dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{item.timeLabel || '--:--'}</span>
                            {item.status && (
                              <span
                                className={[
                                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                  item.status === 'Sudah upload'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700',
                                ].join(' ')}
                              >
                                {item.status}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 line-clamp-2">{item.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
