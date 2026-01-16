import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import { computeProductStock } from '../domain/selectors'
import type { ProductKind, StockMovementType } from '../data/types'
import { isoNow, formatDate } from '../utils/date'

function productKindLabel(kind: ProductKind) {
  if (kind === 'FINISHED') return 'Barang jadi (siap jual)'
  if (kind === 'RAW_MATERIAL') return 'Bahan mentah'
  return 'Lainnya'
}

export function InventoryPage() {
  const data = useAppData()

  const stockRows = useMemo(() => computeProductStock(data), [data])

  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [productKind, setProductKind] = useState<ProductKind>('FINISHED')

  const [movementProductId, setMovementProductId] = useState(data.products[0]?.id ?? '')
  const [movementType, setMovementType] = useState<StockMovementType>('IN')
  const [movementQty, setMovementQty] = useState(1)
  const [movementDate, setMovementDate] = useState(() => formatDate(isoNow()))
  const [movementEmployeeId, setMovementEmployeeId] = useState(data.employees[0]?.id ?? '')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (movementProductId && data.products.some((p) => p.id === movementProductId)) return
    setMovementProductId(data.products[0]?.id ?? '')
  }, [data.products, movementProductId])

  useEffect(() => {
    if (movementEmployeeId && data.employees.some((e) => e.id === movementEmployeeId)) return
    setMovementEmployeeId(data.employees[0]?.id ?? '')
  }, [data.employees, movementEmployeeId])

  function addProduct() {
    setError(null)
    try {
      if (!productName.trim() || !category.trim()) {
        setError('Nama produk dan kategori wajib diisi')
        return
      }
      const p = repo.products.create({ name: productName.trim(), category: category.trim(), kind: productKind })
      setProductName('')
      setCategory('')
      setMovementProductId(p.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menambah produk')
    }
  }

  function addMovement() {
    setError(null)
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
      repo.stockMovements.create({
        productId: movementProductId,
        type: movementType,
        quantity: movementQty,
        date: dateIso,
        responsibleEmployeeId: movementEmployeeId,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mencatat stok')
    }
  }

  function deleteProduct(productId: string, productNameLabel: string) {
    setError(null)
    try {
      const ok = window.confirm(`Hapus barang "${productNameLabel}"? Riwayat stok untuk barang ini juga akan dihapus.`)
      if (!ok) return
      repo.products.remove(productId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus produk')
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
              Simpan Produk
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
              Simpan Pergerakan Stok
            </Button>
          </div>
        </Card>
      </div>

      {error && <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}

      <Card title="Ringkasan Stok" description="Stok masuk, keluar, dan sisa stok per produk.">
        <Table headers={['Produk', 'Kategori', 'Keterangan', 'Stok Masuk', 'Stok Keluar', 'Sisa Stok', 'Aksi']}>
          {stockRows.map((r) => (
            <tr key={r.product.id} className="hover:bg-gray-50">
              <td className="px-5 py-3 text-gray-900">{r.product.name}</td>
              <td className="px-5 py-3 text-gray-700">{r.product.category}</td>
              <td className="px-5 py-3 text-gray-700">{productKindLabel(r.product.kind)}</td>
              <td className="px-5 py-3 text-gray-700">{r.stockIn}</td>
              <td className="px-5 py-3 text-gray-700">{r.stockOut}</td>
              <td className="px-5 py-3 font-semibold text-gray-900">{r.remaining}</td>
              <td className="px-5 py-3">
                <Button
                  type="button"
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  onClick={() => deleteProduct(r.product.id, r.product.name)}
                >
                  Hapus
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Riwayat Pergerakan Stok" description="Data mentah (log) yang siap diintegrasikan ke backend.">
        <Table headers={['Tanggal', 'Produk', 'Jenis', 'Qty', 'Penanggung Jawab']}>
          {data.stockMovements.map((m) => {
            const p = data.products.find((x) => x.id === m.productId)
            const emp = data.employees.find((x) => x.id === m.responsibleEmployeeId)
            return (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">{formatDate(m.date)}</td>
                <td className="px-5 py-3 text-gray-900">{p?.name ?? m.productId}</td>
                <td className="px-5 py-3 text-gray-700">{m.type === 'IN' ? 'Masuk' : 'Keluar'}</td>
                <td className="px-5 py-3 text-gray-700">{m.quantity}</td>
                <td className="px-5 py-3 text-gray-700">{emp?.name ?? m.responsibleEmployeeId}</td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </div>
  )
}
