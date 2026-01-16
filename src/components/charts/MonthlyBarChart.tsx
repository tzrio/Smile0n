import './chartSetup'
import { Bar } from 'react-chartjs-2'

type Props = {
  months: string[]
  label: string
  data: number[]
}

export function MonthlyBarChart({ months, label, data }: Props) {
  const chartData = {
    labels: months,
    datasets: [
      {
        label,
        data,
        backgroundColor: 'rgba(17, 24, 39, 0.12)',
        borderColor: 'rgb(17, 24, 39)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'bottom' as const },
    },
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { precision: 0 } },
    },
  }

  return <Bar data={chartData} options={options} />
}
