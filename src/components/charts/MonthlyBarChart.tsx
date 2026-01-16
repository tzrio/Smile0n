import './chartSetup'
import { Bar } from 'react-chartjs-2'

type Props = {
  months: string[]
  label: string
  data: number[]
}

export function MonthlyBarChart({ months, label, data }: Props) {
  const hasData = data.some((n) => Number.isFinite(n) && n !== 0)

  if (!months.length || !data.length || !hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-white to-indigo-50 text-sm text-gray-600 ring-1 ring-gray-200/70">
        Belum ada data untuk ditampilkan.
      </div>
    )
  }

  const chartData = {
    labels: months,
    datasets: [
      {
        label,
        data,
        backgroundColor: data.map((v) => (v >= 0 ? 'rgba(79, 70, 229, 0.28)' : 'rgba(244, 63, 94, 0.28)')),
        borderColor: data.map((v) => (v >= 0 ? 'rgb(79, 70, 229)' : 'rgb(244, 63, 94)')),
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true } },
      y: { ticks: { precision: 0 }, grid: { color: 'rgba(17, 24, 39, 0.06)' } },
    },
  }

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  )
}
