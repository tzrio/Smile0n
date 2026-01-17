import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: Props) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-gradient-to-br from-white to-indigo-50 px-5 py-8 text-center ring-1 ring-gray-200/70 dark:from-gray-900 dark:to-gray-950 dark:ring-white/10">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/70 dark:bg-gray-900 dark:ring-white/10">
        {icon ?? (
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16v16H4z" />
            <path d="M8 12h8" />
          </svg>
        )}
      </div>
      <div className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
      {description && <div className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
