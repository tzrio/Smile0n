/**
 * Shared button component.
 * Variants are Tailwind-based and theme-aware (dark mode).
 */
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

const base =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 focus:ring-indigo-200',
  secondary:
    'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-white/10',
  danger: 'bg-black text-white shadow-sm hover:bg-gray-800 focus:ring-gray-300 dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-red-200',
}

export function Button({ variant = 'primary', className, ...props }: Props) {
  return <button className={[base, variants[variant], className].filter(Boolean).join(' ')} {...props} />
}
