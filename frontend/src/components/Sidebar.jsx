import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Users, BarChart3, Bell, ClipboardList, TrendingUp,
  ShieldAlert, ChevronLeft, ChevronRight,
  LogOut, Settings, Menu, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import logo from '../assets/logo.jpg'
import { reorderService } from '../services/reorderService'

const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',  Icon: LayoutDashboard, label: 'Dashboard',   roles: ['admin','manager','staff'] },
      { to: '/products',   Icon: Package,         label: 'Products',    roles: ['admin','manager','staff'] },
      { to: '/sales',      Icon: ShoppingCart,    label: 'Sales',       roles: ['admin','manager','staff'] },
      { to: '/purchases',  Icon: Truck,           label: 'Purchases',   roles: ['admin','manager'] },
      { to: '/suppliers',  Icon: Users,           label: 'Suppliers',   roles: ['admin','manager','staff'] },
      { to: '/alerts',     Icon: Bell,            label: 'Alerts',      roles: ['admin','manager','staff'] },
      { to: '/reorder',    Icon: AlertTriangle,   label: 'Reorder',     roles: ['admin','manager'] },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports',    Icon: BarChart3,       label: 'Reports',     roles: ['admin','manager'] },
      { to: '/forecast',   Icon: TrendingUp,      label: 'Forecasting', roles: ['admin','manager'] },
    ]
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin/users', Icon: ShieldAlert,   label: 'Users',       roles: ['admin'] },
      { to: '/admin/audit', Icon: ClipboardList, label: 'Audit Log',   roles: ['admin','manager'] },
    ]
  },
]

export default function Sidebar({ collapsed, setCollapsed, onClose }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      reorderService.getPendingCount()
        .then(({ data }) => setPendingCount(data.count))
        .catch(() => {})
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside
      className={`
        flex flex-col bg-white h-full border-r border-border
        transition-all duration-300
        ${onClose ? '' : 'fixed top-0 left-0 z-40 hidden md:flex h-screen'}
        ${collapsed ? 'w-16' : 'w-full md:w-60'}
      `}
    >
      {}
      <div className={`h-16 flex items-center border-b border-border shrink-0 ${collapsed ? 'justify-center' : 'px-5'}`}>
        {!onClose && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`items-center gap-3 p-2 rounded-lg text-text-secondary hover:bg-surface transition-colors md:flex hidden ${collapsed ? '' : 'w-full'}`}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <Menu size={20} className="shrink-0" />
            {!collapsed && <span className="text-sm font-semibold text-text-primary">Menu</span>}
          </button>
        )}
      </div>

      {}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(n => n.roles.includes(user?.role))
          if (!visibleItems.length) return null

          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <p className="px-5 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5 px-2">
                {visibleItems.map(({ to, Icon, label }) => {
                  const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to))
                  const isReorder = label === 'Reorder'
                  const hasPending = isReorder && pendingCount > 0

                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        title={collapsed ? label : undefined}
                        onClick={() => onClose?.()}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                          ${active
                            ? 'bg-brand-orange-light text-brand-orange shadow-sm'
                            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                          }
                          ${collapsed ? 'justify-center' : ''}
                        `}
                      >
                        <div className="relative">
                          <Icon 
                            size={17} 
                            className={`shrink-0 ${hasPending ? 'text-amber-500' : ''}`} 
                          />
                          {collapsed && hasPending && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                          )}
                        </div>
                        {!collapsed && (
                          <div className="flex-1 flex items-center justify-between">
                            <span>{label}</span>
                            {hasPending && (
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                {pendingCount}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </nav>

      {}
      <div className="border-t border-border p-2 space-y-0.5 shrink-0">
        <Link
          to="/profile"
          title={collapsed ? 'Profile & Settings' : undefined}
          onClick={() => onClose?.()}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface hover:text-text-primary transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <Settings size={17} className="shrink-0" />
          {!collapsed && <span>Profile</span>}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-error-bg hover:text-error-text transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
