import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const isAuth = localStorage.getItem('auth') === 'true'
  const role = localStorage.getItem('role')
  const location = useLocation()

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
