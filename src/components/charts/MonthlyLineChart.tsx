import './chartSetup'
import { Line } from 'react-chartjs-2'
import { useTheme } from '../../app/ThemeContext'

/**
 * Theme-aware line chart wrapper for monthly analytics.
 */

type Series = {
  label: string
  data: number[]
}

type Props = {
  months: string[]
  series: Series[]
}

export function MonthlyLineChart({ months, series }: Props) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const hasData = series.some((s) => s.data.some((n) => Number.isFinite(n) && n !== 0))

  if (!months.length || !series.length || !hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-white to-indigo-50 text-sm text-gray-600 ring-1 ring-gray-200/70 dark:from-gray-900 dark:to-gray-950 dark:text-gray-300 dark:ring-white/10">
        Belum ada data untuk ditampilkan.
      </div>
    )
  }

  const palette = [
    { border: 'rgb(79, 70, 229)', bg: 'rgba(79, 70, 229, 0.16)' },
    { border: 'rgb(13, 148, 136)', bg: 'rgba(13, 148, 136, 0.16)' },
    { border: 'rgb(234, 88, 12)', bg: 'rgba(234, 88, 12, 0.16)' },
  ]

  const data = {
    labels: months,
    datasets: series.map((s, idx) => {
      const colors = palette[idx % palette.length]
      return {
        label: s.label,
        data: s.data,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.3,
      }
    }),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 10, color: isDark ? 'rgba(229, 231, 235, 0.92)' : 'rgba(55, 65, 81, 0.92)' },
      },
      title: { display: false },
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
      <Line data={data} options={options} />
    </div>
  )
}
