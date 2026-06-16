import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, ClipboardList,
  Settings, BarChart3, LogOut, Shield, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { logout } from '../api/client'

const navItems = [
  { to: '/admin',             icon: BarChart3,       label: 'Overview',      end: true },
  { to: '/admin/calendar',    icon: CalendarDays,    label: 'Calendar' },
  { to: '/admin/appointments',icon: ClipboardList,   label: 'Appointments' },
  { to: '/admin/settings',    icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token') || ''
      await logout(refresh)
    } catch { /* ignore */ }
    localStorage.clear()
    toast.success('Logged out successfully')
    navigate('/admin/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-700 flex flex-col z-30 shadow-2xl">
      {/* Logo / Brand */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-display font-semibold text-sm leading-tight">Admin Portal</p>
            <p className="text-brand-200 text-xs">Appointment Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? 'sidebar-item-active' : 'sidebar-item'
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white text-sm font-semibold truncate">{user.name || user.username || 'Admin'}</p>
          <p className="text-brand-200 text-xs mt-0.5">Administrator</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                     text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
