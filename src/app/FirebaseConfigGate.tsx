import React from 'react'

import { getFirebaseConfigStatus } from '../firebase/firebase'

type Props = {
  children: React.ReactNode
}

export function FirebaseConfigGate({ children }: Props) {
  const status = getFirebaseConfigStatus()

  if (status.ok) return <>{children}</>

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
        <div className="text-sm font-semibold text-gray-900">Konfigurasi Firebase belum lengkap</div>
        <div className="mt-2 text-sm text-gray-700">{status.message}</div>

        <div className="mt-4 text-sm font-semibold text-gray-900">Yang belum diset</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {status.missingKeys.map((key) => (
            <li key={key} className="font-mono text-xs text-gray-700">
              {key}
            </li>
          ))}
        </ul>

        <div className="mt-4 text-xs text-gray-500">
          Untuk GitHub Pages: set semuanya di <span className="font-mono">Repository Settings → Secrets and variables → Actions</span>,
          lalu re-run workflow deploy.
        </div>
      </div>
    </div>
  )
}
