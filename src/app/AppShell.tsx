import { NavLink, Outlet } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'

type IconName =
  | 'dashboard'
  | 'inventory'
  | 'production'
  | 'transactions'
  | 'finance'
  | 'employees'
  | 'profile'
  | 'logout'

function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = className ?? 'h-4 w-4'

  if (name === 'dashboard') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-10h8V3h-8v8Z" />
      </svg>
    )
  }

  if (name === 'inventory') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h18" />
        <path d="M6 7l1-3h10l1 3" />
        <path d="M5 7v14h14V7" />
        <path d="M9 11h6" />
      </svg>
    )
  }

  if (name === 'production') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M8 20v-6h8v6" />
      </svg>
    )
  }

  if (name === 'transactions') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 7h10M7 12h10M7 17h6" />
        <path d="M5 3h14v18H5z" />
      </svg>
    )
  }

  if (name === 'finance') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 16l4-5 3 3 4-6" />
      </svg>
    )
  }

  if (name === 'employees') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 11a4 4 0 1 0-8 0" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    )
  }

  if (name === 'logout') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  )
}

const linkBase = 'block rounded-md px-3 py-2 text-sm font-semibold transition'

function LinkItem({
  to,
  label,
  icon,
  collapsed,
}: {
  to: string
  label: string
  icon: IconName
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          linkBase,
          'flex items-center gap-3',
          collapsed ? 'justify-center px-2' : 'px-3',
          isActive ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
      title={collapsed ? label : undefined}
    >
      <Icon name={icon} className="h-4 w-4" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function initialsFromName(name: string) {
  const parts = name
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean)
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'U'
}

export function AppShell() {
  const { user, logout } = useAuth()
  const logoUrl = `${import.meta.env.BASE_URL}smileon_logo.jpg`
  const COLLAPSED_KEY = 'wallDecorAdmin.ui.sidebarCollapsed.v1'
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY)
      if (raw === '1' || raw === 'true') return true
      if (raw === '0' || raw === 'false') return false
      return false
    } catch {
      return false
    }
  })
  const navWidthClass = collapsed ? 'md:grid-cols-[72px_1fr]' : 'md:grid-cols-[280px_1fr]'
  const menuItems = useMemo(
    () =>
      [
        { to: '/app/dashboard', label: 'Dashboard', icon: 'dashboard' as const },
        { to: '/app/inventory', label: 'Stok Barang', icon: 'inventory' as const },
        { to: '/app/production', label: 'Produksi', icon: 'production' as const },
        { to: '/app/transactions', label: 'Transaksi', icon: 'transactions' as const },
        { to: '/app/finance', label: 'Laporan Keuangan', icon: 'finance' as const },
        { to: '/app/employees', label: 'Karyawan', icon: 'employees' as const },
        { to: '/app/profile', label: 'Profil', icon: 'profile' as const },
      ],
    []
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-screen-2xl">
        <div className={["grid min-h-screen grid-cols-1", navWidthClass].join(' ')}>
          <aside className={["bg-gray-900 py-5 text-gray-100 md:min-h-screen", collapsed ? 'px-2' : 'px-4'].join(' ')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!collapsed && (
                  <img
                    src={logoUrl}
                    alt="Logo perusahaan"
                    className="h-9 w-9 rounded-md object-cover ring-1 ring-white/10"
                  />
                )}
                {!collapsed && (
                  <div>
                    <div className="text-sm font-semibold tracking-tight text-white">Smile0n Admin</div>
                    <div className="mt-1 text-xs text-gray-300">Jaya Selalu</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!collapsed && (
                  <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                    {user?.role}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((v) => {
                      const next = !v
                      try {
                        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0')
                      } catch {
                        // ignore
                      }
                      return next
                    })
                  }
                  className="rounded-md bg-white/10 p-2 text-white hover:bg-white/15"
                  aria-label={collapsed ? 'Buka menu' : 'Tutup menu'}
                  title={collapsed ? 'Buka menu' : 'Tutup menu'}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="mt-6">
              {!collapsed && (
                <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Menu</div>
              )}
              <nav className="mt-2 space-y-1">
                {menuItems.map((it) => (
                  <LinkItem key={it.to} to={it.to} label={it.label} icon={it.icon} collapsed={collapsed} />
                ))}
              </nav>
            </div>

            <div className={["mt-8 rounded-xl bg-white/5 ring-1 ring-white/10", collapsed ? 'p-2' : 'p-4'].join(' ')}>
              {!collapsed && <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Akun</div>}
              <div className={["flex items-center gap-3", collapsed ? 'justify-center' : 'mt-3'].join(' ')}>
                {user?.avatarDataUrl ? (
                  <img
                    src={user.avatarDataUrl}
                    alt="Foto profil"
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-1 ring-white/10">
                    {initialsFromName(user?.name ?? '')}
                  </div>
                )}

                {!collapsed && (
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
                    <div className="truncate text-xs text-gray-300">{user?.email}</div>
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className={[
                  'mt-4 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15',
                  collapsed ? 'w-full px-0' : 'w-full',
                ].join(' ')}
                title={collapsed ? 'Logout' : undefined}
              >
                {collapsed ? (
                  <span className="flex w-full items-center justify-center">
                    <Icon name="logout" className="h-4 w-4" />
                  </span>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </aside>

          <main className="p-4 md:p-8">
            <div className="rounded-2xl bg-gray-100">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
