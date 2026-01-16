import type { SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement>

export function Select({ className, ...props }: Props) {
  return (
    <select
      className={[
        'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
        'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
