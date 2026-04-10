import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarPlus, Car, MapPin, Receipt, Leaf, ShieldCheck, LogOut, ChevronLeft, ChevronRight, Truck
} from 'lucide-react'
import { useAuth, useAppContext } from '@/store/AppContext'
import clsx from 'clsx'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/prenotazione', label: 'Prenotazioni', icon: CalendarPlus },
  { to: '/flotta', label: 'Flotta', icon: Truck },
  { to: '/tracking', label: 'Tracking Live', icon: MapPin },
  { to: '/fatturazione', label: 'Fatturazione', icon: Receipt },
  { to: '/carbon', label: 'Carbon Footprint', icon: Leaf },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck },
]

export default function Sidebar() {
  const { company, user, logout } = useAuth()
  const { state, dispatch } = useAppContext()
  const open = state.ui.sidebarOpen
  const location = useLocation()

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-brand-900 text-white transition-all duration-300 ease-in-out',
        open ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo / Company */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-brand-800">
        <div className={clsx('flex items-center gap-3 overflow-hidden', !open && 'justify-center w-full')}>
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
            <Car size={16} className="text-white" />
          </div>
          {open && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate">{company?.ragioneSociale ?? 'NCC Gestionale'}</p>
              <p className="text-xs text-brand-300 truncate">{user?.firstName} {user?.lastName}</p>
            </div>
          )}
        </div>
        {open && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="p-1 rounded hover:bg-brand-800 flex-shrink-0"
            aria-label="Comprimi sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {!open && (
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          className="mx-auto mt-2 p-1.5 rounded hover:bg-brand-800"
          aria-label="Espandi sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon, exact }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  title={!open ? label : undefined}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-brand-200 hover:bg-brand-800 hover:text-white',
                    !open && 'justify-center px-2'
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {open && <span className="truncate">{label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-brand-800">
        <button
          onClick={logout}
          title={!open ? 'Esci' : undefined}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-200 hover:bg-brand-800 hover:text-white transition-colors',
            !open && 'justify-center px-2'
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {open && <span>Esci</span>}
        </button>
      </div>
    </aside>
  )
}
