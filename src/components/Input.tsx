import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={[
        'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm',
        'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
