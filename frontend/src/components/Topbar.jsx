import { Menu, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../assets/logo.jpg'

const ROLE_BADGE = {
  admin:   'bg-brand-orange-light text-brand-orange',
  manager: 'bg-brand-blue-light text-brand-blue',
  staff:   'bg-surface text-text-secondary border border-border',
}

export default function Topbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm">
      {}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors text-text-secondary"
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      {}
      <div className="hidden md:flex items-center gap-2.5 flex-1">
        <img src={logo} alt="Leo Data Tech" className="w-8 h-8 object-contain rounded-lg border border-border p-0.5" />
        <span className="font-display font-bold text-base text-text-primary tracking-tight">
          Inven<span className="text-brand-orange">Leo</span>
        </span>
      </div>

      {}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange text-xs font-bold shrink-0 ring-2 ring-brand-orange/10">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-text-primary leading-none">{user?.username}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded-full inline-block ${ROLE_BADGE[user?.role] || ROLE_BADGE.staff}`}>
              {user?.role}
            </p>
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-1 hidden sm:block"></div>

        <button
          onClick={async () => {
            await logout()
            toast.success('Logged out successfully')
            navigate('/login')
          }}
          className="group relative p-2 rounded-lg text-text-secondary hover:bg-error-bg hover:text-error-text transition-all duration-200"
        >
          <LogOut size={18} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-black text-[10px] font-bold rounded shadow-sm border border-border opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            logout
          </span>
        </button>
      </div>
    </header>
  )
}
