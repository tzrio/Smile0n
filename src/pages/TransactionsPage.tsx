import { useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { PageHeader } from '../components/PageHeader'
import { Select } from '../components/Select'
import { Table } from '../components/Table'
import { repo } from '../data/repository'
import { useAppData } from '../data/useAppData'
import type { TransactionType } from '../data/types'
import { formatDate, isoNow } from '../utils/date'
import { formatIDR } from '../utils/money'

export function TransactionsPage() {
  const data = useAppData()

  const [type, setType] = useState<TransactionType>('PURCHASE')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(() => formatDate(isoNow()))
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState(data.employees[0]?.id ?? '')

  const [error, setError] = useState<string | null>(null)

  function addTransaction() {
    setError(null)
    try {
      if (!description.trim()) {
        setError('Deskripsi wajib diisi')
        return
      }
      if (!responsibleEmployeeId) {
        setError('Pilih penanggung jawab')
        return
      }
      if (amount <= 0) {
        setError('Nominal harus > 0')
        return
      }
      const dateIso = new Date(date).toISOString()
      repo.transactions.create({
        type,
        description: description.trim(),
        amount,
        date: dateIso,
        responsibleEmployeeId,
      })
      setDescription('')
      setAmount(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mencatat transaksi')
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

          <div>
            <div className="text-xs font-medium text-gray-700">Nominal (IDR)</div>
            <div className="mt-1">
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
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
        </div>

        <div className="mt-3">
          <Button type="button" onClick={addTransaction} className="w-full md:w-auto">
            Simpan Transaksi
          </Button>
        </div>

        {error && <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">{error}</div>}
      </Card>

      <Card title="Riwayat Transaksi" description="Semua transaksi pembelian dan penjualan.">
        <Table headers={['Tanggal', 'Jenis', 'Deskripsi', 'Nominal', 'Penanggung Jawab']}>
          {data.transactions.map((t) => {
            const emp = data.employees.find((x) => x.id === t.responsibleEmployeeId)
            return (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-700">{formatDate(t.date)}</td>
                <td className="px-5 py-3 text-gray-700">{t.type === 'PURCHASE' ? 'Pembelian' : 'Penjualan'}</td>
                <td className="px-5 py-3 text-gray-900">{t.description}</td>
                <td className="px-5 py-3 text-gray-700">{formatIDR(t.amount)}</td>
                <td className="px-5 py-3 text-gray-700">{emp?.name ?? t.responsibleEmployeeId}</td>
              </tr>
            )
          })}
        </Table>
      </Card>
    </div>
  )
}
