import './chartSetup'
import { Line } from 'react-chartjs-2'

type Series = {
  label: string
  data: number[]
}

type Props = {
  months: string[]
  series: Series[]
}

export function MonthlyLineChart({ months, series }: Props) {
  const data = {
    labels: months,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.data,
      borderColor: 'rgb(17, 24, 39)',
      backgroundColor: 'rgba(17, 24, 39, 0.12)',
      tension: 0.2,
    })),
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { precision: 0 } },
    },
  }

  return <Line data={data} options={options} />
}
