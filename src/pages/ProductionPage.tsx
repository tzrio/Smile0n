import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import type { Product } from '../data/types'
import { computeProductStock } from '../domain/selectors'
import { formatDate, isoNow } from '../utils/date'
import { useToast } from '../app/ToastContext'
import { useAuth } from '../auth/AuthContext'

function byName(a: Product, b: Product) {
  return a.name.localeCompare(b.name)
}

export function ProductionPage() {
  const data = useAppData()
  const toast = useToast()
  const auth = useAuth()

  const canDeleteHistory = auth.hasRole(['CEO', 'CTO', 'CMO'])

  const rawProducts = useMemo(() => data.products.filter((p) => p.kind === 'RAW_MATERIAL').slice().sort(byName), [data.products])
  const finishedProducts = useMemo(() => data.products.filter((p) => p.kind === 'FINISHED').slice().sort(byName), [data.products])

  const stockRows = useMemo(() => computeProductStock(data), [data])
  const remainingByProductId = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of stockRows) map.set(r.product.id, r.remaining)
    return map
  }, [stockRows])

  const [rawProductId, setRawProductId] = useState(rawProducts[0]?.id ?? '')
  const [rawQuantity, setRawQuantity] = useState(1)
  const [finishedProductId, setFinishedProductId] = useState(finishedProducts[0]?.id ?? '')
  const [finishedQuantity, setFinishedQuantity] = useState(1)
  const [date, setDate] = useState(() => formatDate(isoNow()))
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(data.employees[0]?.id ?? '')
  const [notes, setNotes] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingProductionId, setDeletingProductionId] = useState<string | null>(null)

  useEffect(() => {
    if (rawProductId && rawProducts.some((p) => p.id === rawProductId)) return
    setRawProductId(rawProducts[0]?.id ?? '')
  }, [rawProducts, rawProductId])

  useEffect(() => {
    if (finishedProductId && finishedProducts.some((p) => p.id === finishedProductId)) return
    setFinishedProductId(finishedProducts[0]?.id ?? '')
  }, [finishedProducts, finishedProductId])

  useEffect(() => {
    if (responsibleEmployeeId && data.employees.some((e) => e.id === responsibleEmployeeId)) return
    setResponsibleEmployeeId(data.employees[0]?.id ?? '')
  }, [data.employees, responsibleEmployeeId])

  const rawRemaining = remainingByProductId.get(rawProductId) ?? 0
  const finishedRemaining = remainingByProductId.get(finishedProductId) ?? 0

  const history = useMemo(() => {
    return data.productions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.productions])

  async function addProduction() {
    setError(null)
    setSaving(true)
    try {
      if (!rawProductId) {
        setError('Pilih bahan mentah')
        return
      }
      if (!finishedProductId) {
        setError('Pilih barang jadi')
        return
      }
      if (!responsibleEmployeeId) {
        setError('Pilih penanggung jawab')
        return
      }
      if (rawQuantity <= 0 || finishedQuantity <= 0) {
        setError('Qty harus > 0')
        return
      }
      const dateIso = new Date(date).toISOString()

      await Promise.resolve(
        (repo as any).productions.create({
          rawProductId,
          rawQuantity,
          finishedProductId,
          finishedQuantity,
          date: dateIso,
          responsibleEmployeeId,
          notes: notes.trim() ? notes.trim() : undefined,
        })
      )

      setNotes('')
      toast.success('Produksi berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan produksi'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduction(id: string) {
    setError(null)
    if (!canDeleteHistory) {
      const msg = 'Hanya karyawan (CEO/CTO/CMO) yang bisa menghapus riwayat produksi'
      setError(msg)
      toast.error(msg)
      return
    }

    setDeletingProductionId(id)
    try {
      const ok = window.confirm('Hapus item riwayat produksi ini? Stok masuk/keluar terkait juga akan dihapus.')
      if (!ok) return
      await Promise.resolve((repo as any).productions.remove(id))
      toast.success('Riwayat produksi berhasil dihapus')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus riwayat produksi'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingProductionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produksi"
        subtitle="Konversi bahan mentah menjadi barang jadi: bahan keluar (OUT) dan barang jadi masuk (IN) dicatat otomatis."
      />

      <Card title="Tambah Produksi" description="Membuat 2 log stok otomatis: bahan OUT + barang jadi IN.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-gray-700">Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700">Penanggung Jawab</div>
            <div className="mt-1">
              <Select value={responsibleEmployeeId} onChange={(e) => setResponsibleEmployeeId(e.target.value)}>
                {data.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-semibold text-gray-900">Bahan Mentah (OUT)</div>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px]">
              <Select value={rawProductId} onChange={(e) => setRawProductId(e.target.value)} disabled={rawProducts.length === 0}>
                {rawProducts.length === 0 ? (
                  <option value="">Belum ada produk dengan keterangan "Bahan mentah"</option>
                ) : (
                  rawProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </Select>
              <Input
                type="number"
                min={1}
                value={rawQuantity}
                onChange={(e) => setRawQuantity(Number(e.target.value))}
              />
            </div>
            <div className="mt-2 text-xs text-gray-700">Sisa stok saat ini: <span className="font-semibold text-gray-900">{rawRemaining}</span></div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-sm font-semibold text-gray-900">Barang Jadi (IN)</div>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px]">
              <Select value={finishedProductId} onChange={(e) => setFinishedProductId(e.target.value)} disabled={finishedProducts.length === 0}>
                {finishedProducts.length === 0 ? (
                  <option value="">Belum ada produk dengan keterangan "Barang jadi"</option>
                ) : (
                  finishedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </Select>
              <Input
                type="number"
                min={1}
                value={finishedQuantity}
                onChange={(e) => setFinishedQuantity(Number(e.target.value))}
              />
            </div>
            <div className="mt-2 text-xs text-gray-700">Sisa stok saat ini: <span className="font-semibold text-gray-900">{finishedRemaining}</span></div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium text-gray-700">Catatan (opsional)</div>
            <div className="mt-1">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Contoh: Produksi batch #12 / 3 set wall decor" />
            </div>
          </div>
        </div>

        <div className="mt-3">
          <Button type="button" onClick={addProduction} className="w-full md:w-auto" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Produksi'}
          </Button>
        </div>

        {error && <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}
      </Card>

      <Card title="Riwayat Produksi" description="Riwayat produksi yang men-trigger log stok otomatis (OUT bahan + IN barang jadi).">
        <Table
          headers={
            canDeleteHistory
              ? ['Tanggal', 'Bahan Mentah', 'Qty OUT', 'Barang Jadi', 'Qty IN', 'Penanggung Jawab', 'Catatan', 'Aksi']
              : ['Tanggal', 'Bahan Mentah', 'Qty OUT', 'Barang Jadi', 'Qty IN', 'Penanggung Jawab', 'Catatan']
          }
        >
          {history.map((p) => {
            const raw = data.products.find((x) => x.id === p.rawProductId)
            const fin = data.products.find((x) => x.id === p.finishedProductId)
            const emp = data.employees.find((x) => x.id === p.responsibleEmployeeId)
            return (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">{formatDate(p.date)}</td>
                <td className="px-5 py-3 text-gray-900">{raw?.name ?? p.rawProductId}</td>
                <td className="px-5 py-3 text-gray-700">{p.rawQuantity}</td>
                <td className="px-5 py-3 text-gray-900">{fin?.name ?? p.finishedProductId}</td>
                <td className="px-5 py-3 text-gray-700">{p.finishedQuantity}</td>
                <td className="px-5 py-3 text-gray-700">{emp?.name ?? p.responsibleEmployeeId}</td>
                <td className="px-5 py-3 text-gray-700">{p.notes ?? '-'}</td>
                {canDeleteHistory && (
                  <td className="px-5 py-3">
                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => void deleteProduction(p.id)}
                      disabled={deletingProductionId === p.id}
                    >
                      {deletingProductionId === p.id ? '...' : 'Hapus'}
                    </Button>
                  </td>
                )}
              </tr>
            )
          })}
        </Table>
      </Card>
    </div>
  )
}
