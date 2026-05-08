import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Target, Zap, Settings, LogOut, Megaphone, FileText } from 'lucide-react'

const baseNav = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/conversations', icon: MessageSquare,   label: 'Conversations' },
  { to: '/leads',         icon: Target,          label: 'Leads' },
  { to: '/campaigns',     icon: Megaphone,       label: 'Campaigns' },
  { to: '/templates',     icon: FileText,        label: 'Templates' },
]

export default function Layout({ children }) {
  const navigate  = useNavigate()
  const role      = localStorage.getItem('role')
  const isAdmin   = role === 'admin'

  // Admin gets the Settings link appended
  const nav = isAdmin
    ? [...baseNav, { to: '/settings', icon: Settings, label: 'Settings' }]
    : baseNav

  function handleLogout() {
    localStorage.removeItem('auth')
    localStorage.removeItem('role')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col">

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <Zap size={15} className="text-accent" />
            </div>
            <span className="hidden md:block font-display font-bold text-sm tracking-wide text-text-primary">
              LeadFlow
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-muted/40'
                }`
              }
            >
              <Icon size={17} className="flex-shrink-0" />
              <span className="hidden md:block font-body text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-2">
          {/* Bot status */}
          <div className="hidden md:flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span className="text-xs text-text-secondary font-mono">Bot Active</span>
          </div>
          <div className="md:hidden flex justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          </div>

          {/* Logout button */}
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-text-secondary hover:text-hot hover:bg-hot-bg
              border border-transparent hover:border-hot-border
              transition-all duration-200 group
            "
          >
            <LogOut size={15} className="flex-shrink-0" />
            <span className="hidden md:block font-body text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
