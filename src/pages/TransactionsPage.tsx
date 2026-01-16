import { Fragment, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { EmptyState } from '../components/EmptyState'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import type { TransactionItem, TransactionType } from '../data/types'
import { formatDate, isoNow } from '../utils/date'
import { formatIDR } from '../utils/money'
import { useToast } from '../app/ToastContext'
import { useAuth } from '../auth/AuthContext'

type TxMode = 'ITEMS' | 'SERVICE'

export function TransactionsPage() {
  const data = useAppData()
  const toast = useToast()
  const auth = useAuth()

  const canDeleteHistory = auth.hasRole(['CEO', 'CTO', 'CMO'])

  const [type, setType] = useState<TransactionType>('PURCHASE')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => formatDate(isoNow()))
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(data.employees[0]?.id ?? '')

  const [mode, setMode] = useState<TxMode>('ITEMS')
  const [serviceAmount, setServiceAmount] = useState(0)
  const [items, setItems] = useState<TransactionItem[]>([
    { productId: data.products[0]?.id ?? '', quantity: 1, unitPrice: 0 },
  ])

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<'ALL' | TransactionType>('ALL')
  const [filterQuery, setFilterQuery] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const totalAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0), 0)
  }, [items])

  const history = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    const fromIso = filterFrom ? new Date(filterFrom).toISOString() : ''
    const toIso = filterTo ? new Date(filterTo).toISOString() : ''

    return data.transactions
      .filter((t) => {
        if (filterType !== 'ALL' && t.type !== filterType) return false
        if (q && !`${t.description}`.toLowerCase().includes(q)) return false
        if (fromIso && t.date < fromIso) return false
        if (toIso && t.date > toIso) return false
        return true
      })
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.transactions, filterFrom, filterQuery, filterTo, filterType])

  useEffect(() => {
    if (responsibleEmployeeId && data.employees.some((e) => e.id === responsibleEmployeeId)) return
    setResponsibleEmployeeId(data.employees[0]?.id ?? '')
  }, [data.employees, responsibleEmployeeId])

  useEffect(() => {
    // Keep item productIds valid when products list changes
    setItems((prev) => {
      if (prev.length === 0) return []
      return prev.map((it) => {
        if (!it.productId) return { ...it, productId: data.products[0]?.id ?? '' }
        if (data.products.some((p) => p.id === it.productId)) return it
        return { ...it, productId: data.products[0]?.id ?? '' }
      })
    })
  }, [data.products])

  function addItemRow() {
    setItems((prev) => [...prev, { productId: data.products[0]?.id ?? '', quantity: 1, unitPrice: 0 }])
  }

  function removeItemRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function ensureAtLeastOneItem() {
    setItems((prev) => (prev.length ? prev : [{ productId: data.products[0]?.id ?? '', quantity: 1, unitPrice: 0 }]))
  }

  async function addTransaction() {
    setError(null)
    setSaving(true)
    try {
      if (!description.trim()) {
        setError('Deskripsi wajib diisi')
        return
      }
      if (!responsibleEmployeeId) {
        setError('Pilih penanggung jawab')
        return
      }
      const dateIso = new Date(date).toISOString()

      if (mode === 'SERVICE') {
        if (Number(serviceAmount) <= 0) {
          setError('Nominal transaksi harus > 0')
          return
        }
        await Promise.resolve(
          (repo as any).transactions.create({
            type,
            description: description.trim(),
            amount: Number(serviceAmount),
            items: undefined,
            date: dateIso,
            responsibleEmployeeId,
          })
        )
      } else {
        if (!items.length) {
          setError('Isi minimal 1 item, atau pilih mode jasa')
          return
        }
        for (const it of items) {
          if (!it.productId) {
            setError('Produk item transaksi wajib dipilih')
            return
          }
          if (Number(it.quantity) <= 0) {
            setError('Qty item transaksi harus > 0')
            return
          }
          if (Number(it.unitPrice) <= 0) {
            setError('Harga satuan item transaksi harus > 0')
            return
          }
        }
        if (totalAmount <= 0) {
          setError('Total transaksi harus > 0')
          return
        }
        await Promise.resolve(
          (repo as any).transactions.create({
            type,
            description: description.trim(),
            // amount akan dihitung otomatis di repo (local/firebase)
            amount: 0,
            items,
            date: dateIso,
            responsibleEmployeeId,
          })
        )
      }

      setDescription('')
      setServiceAmount(0)
      setItems([{ productId: data.products[0]?.id ?? '', quantity: 1, unitPrice: 0 }])
      setMode('ITEMS')
      toast.success('Transaksi berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mencatat transaksi'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTransaction(transactionId: string) {
    setError(null)
    if (!canDeleteHistory) {
      const msg = 'Hanya karyawan (CEO/CTO/CMO) yang bisa menghapus riwayat transaksi'
      setError(msg)
      toast.error(msg)
      return
    }

    setDeletingTransactionId(transactionId)
    try {
      const ok = window.confirm('Hapus item riwayat transaksi ini?')
      if (!ok) return
      await Promise.resolve((repo as any).transactions.remove(transactionId))
      toast.success('Riwayat transaksi berhasil dihapus')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus riwayat transaksi'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingTransactionId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pencatatan Transaksi"
        subtitle="Pembelian bahan/barang dan penjualan produk, lengkap dengan tanggal & penanggung jawab."
      />

      <Card title="Tambah Transaksi">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-medium text-gray-700">Jenis</div>
            <div className="mt-1">
              <Select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="PURCHASE">Pembelian</option>
                <option value="SALE">Penjualan</option>
              </Select>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700">Mode</div>
            <div className="mt-1">
              <Select
                value={mode}
                onChange={(e) => {
                  const next = e.target.value as TxMode
                  setMode(next)
                  if (next === 'ITEMS') ensureAtLeastOneItem()
                }}
              >
                <option value="ITEMS">Dengan item (mengubah stok)</option>
                <option value="SERVICE">Jasa/biaya (tanpa item & tanpa stok)</option>
              </Select>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-700">Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs font-medium text-gray-700">Deskripsi</div>
            <div className="mt-1">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Beli lem kayu / Jual wall decor" />
            </div>
          </div>

          {mode === 'SERVICE' ? (
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-gray-700">Nominal</div>
              <div className="mt-1">
                <Input
                  type="number"
                  min={1}
                  value={serviceAmount}
                  onChange={(e) => setServiceAmount(Number(e.target.value))}
                  placeholder="Contoh: 50000"
                />
              </div>
              <div className="mt-1 text-xs text-gray-600">Catatan: mode ini tidak membuat log stok otomatis.</div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <div className="text-xs font-medium text-gray-700">Item Transaksi (multi-item)</div>
              <div className="mt-2 space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_120px_180px_90px]">
                    <Select
                      value={it.productId}
                      onChange={(e) =>
                        setItems((prev) => prev.map((x, i) => (i === idx ? { ...x, productId: e.target.value } : x)))
                      }
                    >
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>

                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, quantity: Number(e.target.value) } : x))
                        )
                      }
                      placeholder="Qty"
                    />

                    <Input
                      type="number"
                      min={0}
                      value={it.unitPrice}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))
                        )
                      }
                      placeholder="Harga satuan"
                    />

                    <Button type="button" variant="secondary" className="px-2 py-1" onClick={() => removeItemRow(idx)}>
                      Hapus
                    </Button>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" variant="secondary" onClick={addItemRow}>
                    + Tambah Item
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setItems([])}>
                    Kosongkan Item
                  </Button>
                  <div className="text-sm font-semibold text-gray-900">Total: {formatIDR(totalAmount)}</div>
                </div>
              </div>
            </div>
          )}

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
        </div>

        <div className="mt-3">
          <Button type="button" onClick={addTransaction} className="w-full md:w-auto" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </div>

        {error && <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}
      </Card>

      <Card title="Riwayat Transaksi" description="Semua transaksi pembelian dan penjualan.">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <div className="text-xs font-medium text-gray-700">Filter Jenis</div>
            <div className="mt-1">
              <Select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                <option value="ALL">Semua</option>
                <option value="PURCHASE">Pembelian</option>
                <option value="SALE">Penjualan</option>
              </Select>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Cari Deskripsi</div>
            <div className="mt-1">
              <Input value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} placeholder="Cari..." />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Dari Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Sampai Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Catat pembelian/penjualan untuk mulai membangun riwayat transaksi."
          />
        ) : (
          <Table
            headers={
              canDeleteHistory
                ? ['Tanggal', 'Jenis', 'Deskripsi', 'Item', 'Nominal', 'Penanggung Jawab', 'Aksi']
                : ['Tanggal', 'Jenis', 'Deskripsi', 'Item', 'Nominal', 'Penanggung Jawab', 'Aksi']
            }
          >
            {history.map((t) => {
            const emp = data.employees.find((x) => x.id === t.responsibleEmployeeId)
            const hasItems = Array.isArray(t.items) && t.items.length > 0
            const expanded = Boolean(expandedIds[t.id])

            return (
              <Fragment key={t.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{formatDate(t.date)}</td>
                  <td className="px-5 py-3 text-gray-700">{t.type === 'PURCHASE' ? 'Pembelian' : 'Penjualan'}</td>
                  <td className="px-5 py-3 text-gray-900">{t.description}</td>
                  <td className="px-5 py-3 text-gray-700">{hasItems ? `${t.items!.length} item` : '-'}</td>
                  <td className="px-5 py-3 text-gray-700">{formatIDR(t.amount)}</td>
                  <td className="px-5 py-3 text-gray-700">{emp?.name ?? t.responsibleEmployeeId}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() =>
                          setExpandedIds((prev) => ({
                            ...prev,
                            [t.id]: !prev[t.id],
                          }))
                        }
                        disabled={!hasItems}
                      >
                        {expanded ? 'Tutup' : 'Detail'}
                      </Button>
                      {canDeleteHistory && (
                        <Button
                          type="button"
                          variant="danger"
                          className="px-2 py-1 text-xs"
                          onClick={() => void deleteTransaction(t.id)}
                          disabled={deletingTransactionId === t.id}
                        >
                          {deletingTransactionId === t.id ? '...' : 'Hapus'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded && hasItems && (
                  <tr className="bg-gray-50/60">
                    <td className="px-5 py-3" colSpan={7}>
                      <div className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Item Transaksi</div>
                        <div className="mt-2 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="text-xs text-gray-500">
                              <tr>
                                <th className="py-1 text-left font-semibold">Produk</th>
                                <th className="py-1 text-right font-semibold">Qty</th>
                                <th className="py-1 text-right font-semibold">Harga</th>
                                <th className="py-1 text-right font-semibold">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="text-gray-700">
                              {(t.items ?? []).map((it, idx) => {
                                const p = data.products.find((x) => x.id === it.productId)
                                const sub = Number(it.quantity) * Number(it.unitPrice)
                                return (
                                  <tr key={idx} className="border-t border-gray-100">
                                    <td className="py-1 pr-4 text-gray-900">{p?.name ?? it.productId}</td>
                                    <td className="py-1 text-right">{it.quantity}</td>
                                    <td className="py-1 text-right">{formatIDR(it.unitPrice)}</td>
                                    <td className="py-1 text-right font-semibold">{formatIDR(sub)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
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
      </Card>
    </div>
  )
}
