import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { MonthlyBarChart } from '../components/charts/MonthlyBarChart'
import { MonthlyLineChart } from '../components/charts/MonthlyLineChart'
import { useAppData } from '../data/useAppData'
import { computeFinanceSummary, computeMonthlyAnalytics, computeProductStock } from '../domain/selectors'
import { formatIDR } from '../utils/money'

export function DashboardPage() {
  const data = useAppData()

  const finance = computeFinanceSummary(data)
  const finishedProductIds = new Set(data.products.filter((p) => p.kind === 'FINISHED').map((p) => p.id))
  const analytics = computeMonthlyAnalytics(data, 12, { productIds: finishedProductIds })
  const stock = computeProductStock(data, { productIds: finishedProductIds })

  const totalProducts = data.products.length
  const totalEmployees = data.employees.length
  const totalRemainingStock = stock.reduce((acc, r) => acc + r.remaining, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional, stok, transaksi, dan laporan sederhana."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Penjualan" value={formatIDR(finance.totalSales)} />
        <StatCard label="Total Pembelian" value={formatIDR(finance.totalPurchases)} />
        <StatCard label="Untung / Rugi" value={formatIDR(finance.profit)} />
        <StatCard label="Saldo Kas Saat Ini" value={formatIDR(finance.cashBalance)} hint="Saldo pembukaan + (penjualan - pembelian)" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Jumlah Produk" value={`${totalProducts}`} />
        <StatCard label="Jumlah Karyawan" value={`${totalEmployees}`} />
        <StatCard label="Sisa Stok Barang Jadi (Total Unit)" value={`${totalRemainingStock}`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Penjualan & Profit per Bulan" description="12 bulan terakhir">
          <MonthlyLineChart
            months={analytics.months}
            series={[
              { label: 'Penjualan', data: analytics.sales.map((p) => p.value) },
              { label: 'Profit', data: analytics.profit.map((p) => p.value) },
            ]}
          />
        </Card>

        <Card title="Pergerakan Stok Barang Jadi per Bulan" description="Net stok masuk - stok keluar (barang jadi saja)">
          <MonthlyBarChart months={analytics.months} label="Net Stok" data={analytics.stockNet.map((p) => p.value)} />
        </Card>
      </div>
    </div>
  )
}
