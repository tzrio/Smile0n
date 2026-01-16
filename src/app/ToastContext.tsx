import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

type Toast = {
  id: string
  type: ToastType
  message: string
}

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

function toastStyle(type: ToastType) {
  if (type === 'success') return 'border-green-200 bg-green-50 text-green-900'
  if (type === 'error') return 'border-red-200 bg-red-50 text-red-900'
  return 'border-gray-200 bg-white text-gray-900'
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, number>>({})

  function push(type: ToastType, message: string) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [{ id, type, message }, ...prev].slice(0, 4))

    // auto-dismiss
    window.clearTimeout(timers.current[id])
    timers.current[id] = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      delete timers.current[id]
    }, 3500)
  }

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    []
  )

  useEffect(() => {
    // Allow non-React code to trigger toasts (e.g. Firestore listener errors)
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ type?: ToastType; message?: string }>
      const type = e.detail?.type ?? 'info'
      const message = e.detail?.message
      if (!message) return
      push(type, message)
    }

    window.addEventListener('wallDecorAdmin.toast', handler as EventListener)
    return () => window.removeEventListener('wallDecorAdmin.toast', handler as EventListener)
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'rounded-xl border p-3 shadow-sm ring-1 ring-gray-200/40',
              toastStyle(t.type),
            ].join(' ')}
          >
            <div className="text-sm font-semibold">
              {t.type === 'success' ? 'Berhasil' : t.type === 'error' ? 'Gagal' : 'Info'}
            </div>
            <div className="mt-1 text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
