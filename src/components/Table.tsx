import type { ReactNode } from 'react'

type Props = {
  headers: string[]
  children: ReactNode
}

export function Table({ headers, children }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200/70">
      <table className="min-w-full divide-y divide-gray-200/70 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200/70">{children}</tbody>
      </table>
    </div>
  )
}
