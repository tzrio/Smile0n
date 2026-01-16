import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { EmptyState } from '../components/EmptyState'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import { computeProductStock } from '../domain/selectors'
import type { ProductKind, StockMovementType } from '../data/types'
import { isoNow, formatDate } from '../utils/date'
import { useToast } from '../app/ToastContext'
import { useAuth } from '../auth/AuthContext'

function productKindLabel(kind: ProductKind) {
  if (kind === 'FINISHED') return 'Barang jadi (siap jual)'
  if (kind === 'RAW_MATERIAL') return 'Bahan mentah'
  return 'Lainnya'
}

export function InventoryPage() {
  const data = useAppData()
  const toast = useToast()
  const auth = useAuth()

  const canDeleteHistory = auth.hasRole(['CEO', 'CTO', 'CMO'])

  const [productSearch, setProductSearch] = useState('')
  const [productKindFilter, setProductKindFilter] = useState<'ALL' | ProductKind>('ALL')
  const stockRows = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    const rows = computeProductStock(data)
    const filteredByKind =
      productKindFilter === 'ALL' ? rows : rows.filter((r) => r.product.kind === productKindFilter)
    const filtered = q ? filteredByKind.filter((r) => r.product.name.toLowerCase().includes(q)) : filteredByKind
    return filtered.slice().sort((a, b) => a.product.name.localeCompare(b.product.name))
  }, [data, productKindFilter, productSearch])

  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [productKind, setProductKind] = useState<ProductKind>('FINISHED')

  const [movementProductId, setMovementProductId] = useState(data.products[0]?.id ?? '')
  const [movementType, setMovementType] = useState<StockMovementType>('IN')
  const [movementQty, setMovementQty] = useState(1)
  const [movementDate, setMovementDate] = useState(() => formatDate(isoNow()))
  const [movementEmployeeId, setMovementEmployeeId] = useState(data.employees[0]?.id ?? '')

  const [error, setError] = useState<string | null>(null)

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState('')

  const [movementSearch, setMovementSearch] = useState('')
  const [movementFilterProductId, setMovementFilterProductId] = useState('ALL')
  const [movementFilterFrom, setMovementFilterFrom] = useState('')
  const [movementFilterTo, setMovementFilterTo] = useState('')

  const [savingProduct, setSavingProduct] = useState(false)
  const [savingMovement, setSavingMovement] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [deletingMovementId, setDeletingMovementId] = useState<string | null>(null)

  const filteredMovements = useMemo(() => {
    const q = movementSearch.trim().toLowerCase()
    const fromTs = movementFilterFrom ? new Date(movementFilterFrom).getTime() : Number.NEGATIVE_INFINITY
    const toTs = movementFilterTo ? new Date(movementFilterTo).getTime() + 86_399_999 : Number.POSITIVE_INFINITY
    return data.stockMovements
      .filter((m) => {
        if (movementFilterProductId !== 'ALL' && m.productId !== movementFilterProductId) return false
        const mTs = new Date(m.date).getTime()
        if (!Number.isNaN(mTs)) {
          if (mTs < fromTs) return false
          if (mTs > toTs) return false
        }
        if (!q) return true
        const p = data.products.find((x) => x.id === m.productId)
        const emp = data.employees.find((x) => x.id === m.responsibleEmployeeId)
        const hay = `${p?.name ?? m.productId} ${emp?.name ?? ''} ${m.type}`.toLowerCase()
        return hay.includes(q)
      })
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [
    data.employees,
    data.products,
    data.stockMovements,
    movementFilterFrom,
    movementFilterProductId,
    movementFilterTo,
    movementSearch,
  ])

  useEffect(() => {
    if (movementProductId && data.products.some((p) => p.id === movementProductId)) return
    setMovementProductId(data.products[0]?.id ?? '')
  }, [data.products, movementProductId])

  useEffect(() => {
    if (movementEmployeeId && data.employees.some((e) => e.id === movementEmployeeId)) return
    setMovementEmployeeId(data.employees[0]?.id ?? '')
  }, [data.employees, movementEmployeeId])

  async function addProduct() {
    setError(null)
    setSavingProduct(true)
    try {
      if (!productName.trim() || !category.trim()) {
        setError('Nama produk dan kategori wajib diisi')
        return
      }
      const p = await Promise.resolve(
        (repo as any).products.create({ name: productName.trim(), category: category.trim(), kind: productKind })
      )
      setProductName('')
      setCategory('')
      setMovementProductId(p.id)
      toast.success('Produk berhasil ditambahkan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menambah produk'
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingProduct(false)
    }
  }

  async function addMovement() {
    setError(null)
    setSavingMovement(true)
    try {
      if (!movementProductId) {
        setError('Pilih produk')
        return
      }
      if (!movementEmployeeId) {
        setError('Pilih penanggung jawab')
        return
      }
      if (movementQty <= 0) {
        setError('Qty harus > 0')
        return
      }
      const dateIso = new Date(movementDate).toISOString()
      await Promise.resolve(
        (repo as any).stockMovements.create({
        productId: movementProductId,
        type: movementType,
        quantity: movementQty,
        date: dateIso,
        responsibleEmployeeId: movementEmployeeId,
        sourceType: 'MANUAL',
        })
      )
      toast.success('Pergerakan stok berhasil disimpan')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mencatat stok'
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingMovement(false)
    }
  }

  async function deleteProduct(productId: string, productNameLabel: string) {
    setError(null)
    setDeletingProductId(productId)
    try {
      const ok = window.confirm(`Hapus barang "${productNameLabel}"? Riwayat stok untuk barang ini juga akan dihapus.`)
      if (!ok) return
      await Promise.resolve((repo as any).products.remove(productId))
      toast.success('Produk berhasil dihapus')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus produk'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingProductId(null)
    }
  }

  async function startEditProduct(productId: string) {
    const current = data.products.find((p) => p.id === productId)
    if (!current) return
    setEditingProductId(productId)
    setEditingProductName(current.name)
  }

  async function saveEditProduct(productId: string) {
    setError(null)
    setSavingProduct(true)
    try {
      const nextName = editingProductName.trim()
      if (!nextName) {
        setError('Nama produk wajib diisi')
        return
      }
      await Promise.resolve((repo as any).products.update(productId, { name: nextName }))
      toast.success('Nama produk berhasil diperbarui')
      setEditingProductId(null)
      setEditingProductName('')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memperbarui produk'
      setError(msg)
      toast.error(msg)
    } finally {
      setSavingProduct(false)
    }
  }

  async function deleteMovement(movementId: string) {
    setError(null)
    if (!canDeleteHistory) {
      const msg = 'Hanya karyawan (CEO/CTO/CMO) yang bisa menghapus riwayat pergerakan stok'
      setError(msg)
      toast.error(msg)
      return
    }
    setDeletingMovementId(movementId)
    try {
      const ok = window.confirm('Hapus item riwayat pergerakan stok ini?')
      if (!ok) return
      await Promise.resolve((repo as any).stockMovements.remove(movementId))
      toast.success('Riwayat pergerakan stok berhasil dihapus')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menghapus riwayat stok'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeletingMovementId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Manajemen Stok Barang" subtitle="Produk, kategori, stok masuk/keluar, dan sisa stok otomatis." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Tambah Produk">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs font-medium text-gray-700">Nama Produk</div>
              <div className="mt-1">
                <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Nama produk" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">Kategori</div>
              <div className="mt-1">
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Kategori" />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">Keterangan</div>
              <div className="mt-1">
                <Select value={productKind} onChange={(e) => setProductKind(e.target.value as ProductKind)}>
                  <option value="FINISHED">Barang jadi (siap jual)</option>
                  <option value="RAW_MATERIAL">Bahan mentah</option>
                  <option value="OTHER">Lainnya</option>
                </Select>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Button type="button" onClick={addProduct} className="w-full md:w-auto">
              {savingProduct ? 'Menyimpan...' : 'Simpan Produk'}
            </Button>
          </div>
        </Card>

        <Card title="Catat Stok Masuk / Keluar" description="Sisa stok dihitung otomatis dari pergerakan stok.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-gray-700">Produk</div>
              <div className="mt-1">
                <Select value={movementProductId} onChange={(e) => setMovementProductId(e.target.value)}>
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-700">Jenis</div>
              <div className="mt-1">
                <Select value={movementType} onChange={(e) => setMovementType(e.target.value as StockMovementType)}>
                  <option value="IN">Stok Masuk</option>
                  <option value="OUT">Stok Keluar</option>
                </Select>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700">Qty</div>
              <div className="mt-1">
                <Input
                  type="number"
                  min={1}
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700">Tanggal</div>
              <div className="mt-1">
                <Input type="date" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-medium text-gray-700">Penanggung Jawab</div>
              <div className="mt-1">
                <Select value={movementEmployeeId} onChange={(e) => setMovementEmployeeId(e.target.value)}>
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
            <Button type="button" onClick={addMovement} className="w-full md:w-auto">
              {savingMovement ? 'Menyimpan...' : 'Simpan Pergerakan Stok'}
            </Button>
          </div>
        </Card>
      </div>

      {error && <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}

      <Card title="Ringkasan Stok" description="Stok masuk, keluar, dan sisa stok per produk.">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-medium text-gray-700">Cari Produk</div>
            <div className="mt-1">
              <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Cari nama produk..." />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Filter Keterangan</div>
            <div className="mt-1">
              <Select value={productKindFilter} onChange={(e) => setProductKindFilter(e.target.value as any)}>
                <option value="ALL">Semua</option>
                <option value="FINISHED">Barang jadi (siap jual)</option>
                <option value="RAW_MATERIAL">Bahan mentah</option>
                <option value="OTHER">Lainnya</option>
              </Select>
            </div>
          </div>
        </div>
        {stockRows.length === 0 ? (
          <EmptyState
            title="Belum ada produk"
            description="Tambah produk terlebih dulu, lalu catat stok masuk/keluar untuk melihat ringkasan stok."
          />
        ) : (
          <Table headers={['Produk', 'Kategori', 'Keterangan', 'Stok Masuk', 'Stok Keluar', 'Sisa Stok', 'Aksi']}>
            {stockRows.map((r) => (
              <tr key={r.product.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-900">
                  {editingProductId === r.product.id ? (
                    <Input value={editingProductName} onChange={(e) => setEditingProductName(e.target.value)} />
                  ) : (
                    r.product.name
                  )}
                </td>
                <td className="px-5 py-3 text-gray-700">{r.product.category}</td>
                <td className="px-5 py-3 text-gray-700">{productKindLabel(r.product.kind)}</td>
                <td className="px-5 py-3 text-gray-700">{r.stockIn}</td>
                <td className="px-5 py-3 text-gray-700">{r.stockOut}</td>
                <td className="px-5 py-3 font-semibold text-gray-900">{r.remaining}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {editingProductId === r.product.id ? (
                      <>
                        <Button
                          type="button"
                          className="px-2 py-1 text-xs"
                          onClick={() => void saveEditProduct(r.product.id)}
                          disabled={savingProduct}
                        >
                          {savingProduct ? '...' : 'Simpan'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-2 py-1 text-xs"
                          onClick={() => {
                            setEditingProductId(null)
                            setEditingProductName('')
                          }}
                        >
                          Batal
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-2 py-1 text-xs"
                        onClick={() => void startEditProduct(r.product.id)}
                      >
                        Edit Nama
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="danger"
                      className="px-2 py-1 text-xs"
                      onClick={() => deleteProduct(r.product.id, r.product.name)}
                      disabled={deletingProductId === r.product.id || editingProductId === r.product.id}
                    >
                      {deletingProductId === r.product.id ? '...' : 'Hapus'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Riwayat Pergerakan Stok" description="Data mentah (log) yang siap diintegrasikan ke backend.">
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div>
            <div className="text-xs font-medium text-gray-700">Filter Produk</div>
            <div className="mt-1">
              <Select value={movementFilterProductId} onChange={(e) => setMovementFilterProductId(e.target.value)}>
                <option value="ALL">Semua</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Dari Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={movementFilterFrom} onChange={(e) => setMovementFilterFrom(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-700">Sampai Tanggal</div>
            <div className="mt-1">
              <Input type="date" value={movementFilterTo} onChange={(e) => setMovementFilterTo(e.target.value)} />
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-medium text-gray-700">Cari</div>
            <div className="mt-1">
              <Input value={movementSearch} onChange={(e) => setMovementSearch(e.target.value)} placeholder="Cari produk / penanggung jawab..." />
            </div>
          </div>
        </div>
        {filteredMovements.length === 0 ? (
          <EmptyState
            title="Belum ada riwayat stok"
            description="Mulai catat stok masuk/keluar untuk membangun riwayat pergerakan."
          />
        ) : (
          <Table
            headers={
              canDeleteHistory
                ? ['Tanggal', 'Produk', 'Jenis', 'Qty', 'Penanggung Jawab', 'Aksi']
                : ['Tanggal', 'Produk', 'Jenis', 'Qty', 'Penanggung Jawab']
            }
          >
            {filteredMovements.map((m) => {
              const p = data.products.find((x) => x.id === m.productId)
              const emp = data.employees.find((x) => x.id === m.responsibleEmployeeId)
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{formatDate(m.date)}</td>
                  <td className="px-5 py-3 text-gray-900">{p?.name ?? m.productId}</td>
                  <td className="px-5 py-3 text-gray-700">{m.type === 'IN' ? 'Masuk' : 'Keluar'}</td>
                  <td className="px-5 py-3 text-gray-700">{m.quantity}</td>
                  <td className="px-5 py-3 text-gray-700">{emp?.name ?? m.responsibleEmployeeId}</td>
                  {canDeleteHistory && (
                    <td className="px-5 py-3">
                      <Button
                        type="button"
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        onClick={() => void deleteMovement(m.id)}
                        disabled={deletingMovementId === m.id}
                      >
                        {deletingMovementId === m.id ? '...' : 'Hapus'}
                      </Button>
                    </td>
                  )}
                </tr>
              )
            })}
          </Table>
        )}
      </Card>
    </div>
  )
}
