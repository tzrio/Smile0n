type Props = {
  open: boolean
  label?: string
}

export function LogoLoading({ open, label = 'Memproses…' }: Props) {
  const logoUrl = `${import.meta.env.BASE_URL}smileon_logo.jpg`

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[320px] rounded-2xl bg-white/90 p-5 shadow-lg ring-1 ring-gray-200/70">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={logoUrl}
            alt="Logo Smile0n"
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-gray-200/70"
          />
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"
            aria-label="Loading"
          />
        </div>
      </div>
    </div>
  )
}
