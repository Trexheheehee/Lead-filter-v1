import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Conversations from './pages/Conversations'
import Leads from './pages/Leads'
import Campaigns from './pages/Campaigns'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import { initConfig } from './lib/config'

export default function App() {
  // Load app_config once when the app starts
  useEffect(() => {
    initConfig().catch(console.error)
  }, [])

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — all authenticated users */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route index element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/conversations"
        element={
          <ProtectedRoute>
            <Layout><Conversations /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <Layout><Leads /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns"
        element={
          <ProtectedRoute>
            <Layout><Campaigns /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <Layout><Templates /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin-only */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
