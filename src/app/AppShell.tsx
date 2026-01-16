import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const linkBase = 'block rounded-md px-3 py-2 text-sm font-semibold transition'

function LinkItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          linkBase,
          isActive ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {label}
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-screen-2xl">
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="bg-gray-900 px-4 py-5 text-gray-100 md:min-h-screen">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logoUrl}
                  alt="Logo perusahaan"
                  className="h-9 w-9 rounded-md object-cover ring-1 ring-white/10"
                />
                <div>
                  <div className="text-sm font-semibold tracking-tight text-white">Wall Decor Admin</div>
                  <div className="mt-1 text-xs text-gray-300">Internal Dashboard</div>
                </div>
              </div>
              <div className="rounded-full bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                {user?.role}
              </div>
            </div>

            <div className="mt-6">
              <div className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Menu</div>
              <nav className="mt-2 space-y-1">
                <LinkItem to="/app/dashboard" label="Dashboard" />
                <LinkItem to="/app/employees" label="Karyawan" />
                <LinkItem to="/app/inventory" label="Stok Barang" />
                <LinkItem to="/app/transactions" label="Transaksi" />
                <LinkItem to="/app/finance" label="Laporan Keuangan" />
                <LinkItem to="/app/profile" label="Profil" />
              </nav>
            </div>

            <div className="mt-8 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Akun</div>
              <div className="mt-3 flex items-center gap-3">
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
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
                  <div className="truncate text-xs text-gray-300">{user?.email}</div>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 w-full rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Logout
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
