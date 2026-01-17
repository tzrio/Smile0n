import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 md:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
