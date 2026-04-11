import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, CalendarPlus, Car, MapPin, Receipt, Leaf, ShieldCheck,
  LogOut, ChevronLeft, ChevronRight, Truck, Users,
} from 'lucide-react'
import { useAuth, useAppContext } from '@/store/AppContext'
import type { UserRole } from '@/types'
import { USER_ROLE_LABELS } from '@/types'
import clsx from 'clsx'

const ALL_ROLES: UserRole[] = ['autista', 'gestore_flotta', 'azienda', 'dipendente', 'supervisore_it', 'customer_service']

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  exact?: boolean
  allowedRoles: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, allowedRoles: ALL_ROLES },
  { to: '/prenotazione', label: 'Prenotazioni', icon: CalendarPlus, allowedRoles: ALL_ROLES },
  { to: '/flotta', label: 'Flotta', icon: Truck, allowedRoles: ['gestore_flotta', 'supervisore_it'] },
  { to: '/tracking', label: 'Tracking Live', icon: MapPin, allowedRoles: ['gestore_flotta', 'supervisore_it', 'customer_service'] },
  { to: '/fatturazione', label: 'Fatturazione', icon: Receipt, allowedRoles: ['gestore_flotta', 'azienda', 'supervisore_it'] },
  { to: '/carbon', label: 'Carbon Footprint', icon: Leaf, allowedRoles: ['gestore_flotta', 'azienda', 'supervisore_it'] },
  { to: '/compliance', label: 'Compliance', icon: ShieldCheck, allowedRoles: ['gestore_flotta', 'supervisore_it'] },
  { to: '/utenti', label: 'Gestione Utenti', icon: Users, allowedRoles: ['supervisore_it'] },
]

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  autista: 'bg-blue-500',
  gestore_flotta: 'bg-violet-500',
  azienda: 'bg-amber-500',
  dipendente: 'bg-emerald-500',
  supervisore_it: 'bg-red-500',
  customer_service: 'bg-cyan-500',
}

export default function Sidebar() {
  const { company, user, logout, role } = useAuth()
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
          {navItems.map(({ to, label, icon: Icon, exact, allowedRoles }) => {
            const isActive = exact ? location.pathname === to : location.pathname.startsWith(to)
            const allowed = role ? allowedRoles.includes(role) : false
            return (
              <li key={to}>
                {allowed ? (
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
                ) : (
                  <div
                    title={!open ? `${label} — Accesso non autorizzato` : undefined}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-25 cursor-not-allowed select-none',
                      !open && 'justify-center px-2'
                    )}
                  >
                    <Icon size={18} className="flex-shrink-0 text-brand-200" />
                    {open && <span className="truncate text-brand-200">{label}</span>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Role badge + Logout */}
      <div className="p-2 border-t border-brand-800 space-y-1">
        {open && role && (
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', ROLE_BADGE_COLORS[role])} />
            <span className="text-xs text-brand-300 truncate">{USER_ROLE_LABELS[role]}</span>
          </div>
        )}
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
