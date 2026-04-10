import { Bell, Search } from 'lucide-react'
import { useAuth } from '@/store/AppContext'

interface TopbarProps {
  title: string
}

export default function Topbar({ title }: TopbarProps) {
  const { user, company } = useAuth()
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-900 flex-1">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-semibold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 leading-tight">{company?.ragioneSociale}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
