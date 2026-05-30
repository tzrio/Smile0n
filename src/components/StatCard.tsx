type Props = {
  label: string
  value: string
  hint?: string
}

export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200/70 dark:bg-gray-900 dark:ring-white/10 sm:p-3.5 lg:p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300 sm:text-xs">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-xl lg:text-2xl">{value}</div>
      {hint && <div className="mt-1.5 text-[11px] leading-4 text-gray-500 dark:text-gray-300 sm:text-xs sm:leading-5">{hint}</div>}
    </div>
  )
}
