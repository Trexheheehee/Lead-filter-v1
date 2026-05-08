import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const adminUser = import.meta.env.VITE_ADMIN_USERNAME
    const adminPass = import.meta.env.VITE_ADMIN_PASSWORD
    const clientUser = import.meta.env.VITE_CLIENT_USERNAME
    const clientPass = import.meta.env.VITE_CLIENT_PASSWORD

    if (username === adminUser && password === adminPass) {
      localStorage.setItem('auth', 'true')
      localStorage.setItem('role', 'admin')
      navigate(from, { replace: true })
    } else if (username === clientUser && password === clientPass) {
      localStorage.setItem('auth', 'true')
      localStorage.setItem('role', 'client')
      navigate(from, { replace: true })
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-void p-4 relative overflow-hidden">
      {/* Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-glow p-8 animate-fade-up relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center mb-4 shadow-glow">
            <Zap size={24} className="text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Welcome to LeadFlow</h1>
          <p className="text-text-secondary text-sm mt-2">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-card/50 border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card/50 border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder-text-dim focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary transition-colors p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-hot text-sm font-medium justify-center bg-hot-bg/50 border border-hot-border rounded-lg p-2 animate-fade-up">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-accent text-void font-bold rounded-lg px-4 py-2.5 mt-6 hover:bg-accent/90 hover:shadow-glow transition-all active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
