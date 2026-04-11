import { Bell } from 'lucide-react'
import { useAuth } from '@/store/AppContext'
import { USER_ROLE_LABELS } from '@/types'
import clsx from 'clsx'
import type { UserRole } from '@/types'

const ROLE_COLORS: Record<UserRole, string> = {
  autista: 'bg-blue-100 text-blue-700',
  gestore_flotta: 'bg-violet-100 text-violet-700',
  azienda: 'bg-amber-100 text-amber-700',
  dipendente: 'bg-emerald-100 text-emerald-700',
  supervisore_it: 'bg-red-100 text-red-700',
  customer_service: 'bg-cyan-100 text-cyan-700',
}

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const { user, company, role } = useAuth()
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900 flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user?.firstName} {user?.lastName}</p>
            {role ? (
              <span className={clsx('inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-tight', ROLE_COLORS[role])}>
                {USER_ROLE_LABELS[role]}
              </span>
            ) : (
              <p className="text-xs text-gray-500 leading-tight">{company?.ragioneSociale}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
