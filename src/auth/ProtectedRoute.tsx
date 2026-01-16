import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { Role } from './authTypes'

type Props = {
  allowRoles?: Role[]
}

export function ProtectedRoute({ allowRoles }: Props) {
  const { user, hasRole, logout } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowRoles && allowRoles.length > 0 && !hasRole(allowRoles)) {
    logout()
    return <Navigate to="/login" replace state={{ from: location.pathname, reason: 'Akun belum diaktifkan oleh CEO.' }} />
  }

  return <Outlet />
}
