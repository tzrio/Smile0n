type Props = {
  label: string
  value: string
  hint?: string
}

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 dark:bg-gray-900 dark:ring-white/10">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{value}</div>
      {hint && <div className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-300">{hint}</div>}
    </div>
  )
}
