import './chartSetup'
import { Bar } from 'react-chartjs-2'
import { useTheme } from '../../app/ThemeContext'

/**
 * Theme-aware bar chart wrapper for monthly analytics.
 */

type Props = {
  months: string[]
  label: string
  data: number[]
}

export function MonthlyBarChart({ months, label, data }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const hasData = data.some((n) => Number.isFinite(n) && n !== 0)

  if (!months.length || !data.length || !hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-white to-indigo-50 text-sm text-gray-600 ring-1 ring-gray-200/70 dark:from-gray-900 dark:to-gray-950 dark:text-gray-300 dark:ring-white/10">
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
      x: {
        grid: { display: false },
        ticks: { maxRotation: 0, autoSkip: true, color: isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.85)' },
      },
      y: {
        ticks: { precision: 0, color: isDark ? 'rgba(209, 213, 219, 0.9)' : 'rgba(55, 65, 81, 0.85)' },
        grid: { color: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(17, 24, 39, 0.06)' },
      },
    },
  }

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  )
}
