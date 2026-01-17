/**
 * Finance summary page:
 * - Aggregates sales/purchases into profit and cash balance
 * - Monthly analytics chart + export CSV
 */
import { Card } from '../components/Card'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { Button } from '../components/Button'
import { useAppData } from '../data/useAppData'
import { computeFinanceSummary, computeMonthlyAnalytics } from '../domain/selectors'
import { isoNow } from '../utils/date'
import { formatIDR } from '../utils/money'
import { downloadCsv } from '../utils/csv'
import { MonthlyLineChart } from '../components/charts/MonthlyLineChart'

export function FinancePage() {
  const data = useAppData()
  const finance = computeFinanceSummary(data)
  const analytics = computeMonthlyAnalytics(data, 12)

  function exportFinanceCsv() {
    const filename = `laporan-keuangan-${new Date(isoNow()).toISOString().slice(0, 10)}`

    const rows = [
      {
        month: 'TOTAL',
        sales: finance.totalSales,
        purchases: finance.totalPurchases,
        profit: finance.profit,
        cashOpeningBalance: data.settings.cashOpeningBalance,
        cashBalance: finance.cashBalance,
      },
      ...analytics.months.map((m) => {
        const sales = analytics.sales.find((p) => p.month === m)?.value ?? 0
        const purchases = analytics.purchases.find((p) => p.month === m)?.value ?? 0
        return {
          month: m,
          sales,
          purchases,
          profit: sales - purchases,
          cashOpeningBalance: '',
          cashBalance: '',
        }
      }),
    ]

    downloadCsv(filename, rows, [
      { header: 'Bulan', value: (r) => r.month },
      { header: 'Penjualan', value: (r) => r.sales },
      { header: 'Pembelian', value: (r) => r.purchases },
      { header: 'Profit', value: (r) => r.profit },
      { header: 'Saldo Pembukaan', value: (r) => r.cashOpeningBalance },
      { header: 'Saldo Kas Saat Ini', value: (r) => r.cashBalance },
    ])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Keuangan Sederhana"
        subtitle="Total penjualan, total pembelian, untung/rugi, dan saldo kas saat ini."
        right={
          <Button
            variant="secondary"
            onClick={exportFinanceCsv}
            disabled={data.transactions.length === 0}
            title={data.transactions.length === 0 ? 'Tidak ada transaksi untuk diexport' : 'Export CSV'}
          >
            Export CSV
          </Button>
        }
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
