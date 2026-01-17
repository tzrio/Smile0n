import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={[
        'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm',
        'dark:border-white/10 dark:bg-gray-950/40 dark:text-gray-100 dark:placeholder:text-gray-400/80',
        'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:border-white/20 dark:focus:ring-white/10',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
