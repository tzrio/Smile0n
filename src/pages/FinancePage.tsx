import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { useAppData } from '../data/useAppData'
import { computeFinanceSummary, computeMonthlyAnalytics } from '../domain/selectors'
import { formatIDR } from '../utils/money'
import { MonthlyLineChart } from '../components/charts/MonthlyLineChart'

export function FinancePage() {
  const data = useAppData()
  const finance = computeFinanceSummary(data)
  const analytics = computeMonthlyAnalytics(data, 12)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Keuangan Sederhana"
        subtitle="Total penjualan, total pembelian, untung/rugi, dan saldo kas saat ini."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Penjualan" value={formatIDR(finance.totalSales)} />
        <StatCard label="Total Pembelian" value={formatIDR(finance.totalPurchases)} />
        <StatCard label="Untung / Rugi" value={formatIDR(finance.profit)} hint="Penjualan - Pembelian" />
        <StatCard label="Saldo Kas Saat Ini" value={formatIDR(finance.cashBalance)} hint="Saldo pembukaan + profit" />
      </div>

      <Card title="Tren Penjualan & Pembelian" description="12 bulan terakhir">
        <MonthlyLineChart
          months={analytics.months}
          series={[
            { label: 'Penjualan', data: analytics.sales.map((p) => p.value) },
            { label: 'Pembelian', data: analytics.purchases.map((p) => p.value) },
          ]}
        />
      </Card>
    </div>
  )
}
