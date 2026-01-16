import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

const base =
  'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-gray-900 text-white shadow-sm hover:bg-gray-800',
  secondary: 'border border-gray-200 bg-white text-gray-900 shadow-sm hover:bg-gray-50',
  danger: 'bg-black text-white shadow-sm hover:bg-gray-800',
}

export function Button({ variant = 'primary', className, ...props }: Props) {
  return <button className={[base, variants[variant], className].filter(Boolean).join(' ')} {...props} />
}
