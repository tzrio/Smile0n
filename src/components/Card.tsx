import type { ReactNode } from 'react'

type Props = {
  title?: string
  description?: string
  children: ReactNode
  right?: ReactNode
}

export function Card({ title, description, right, children }: Props) {
  return (
    <section className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
      {(title || description || right) && (
        <header className="flex items-start justify-between gap-4 border-b border-gray-200/70 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight text-gray-900">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-5 text-gray-600">{description}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}
