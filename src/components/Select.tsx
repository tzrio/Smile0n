import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={[
        'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
        'dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-100',
        'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:border-white/20 dark:focus:ring-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
