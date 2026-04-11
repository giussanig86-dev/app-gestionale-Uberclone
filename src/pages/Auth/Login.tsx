import { useState } from 'react'
import { Car, Lock, Mail, Truck, Building2, User, ShieldCheck, Headphones } from 'lucide-react'
import { useAuth } from '@/store/AppContext'
import { mockCompanies } from '@/mocks/db/companies'
import Button from '@/components/ui/Button'
import type { UserRole } from '@/types'
import { USER_ROLE_LABELS } from '@/types'
import clsx from 'clsx'

interface DemoAccount {
  role: UserRole
  email: string
  name: string
  icon: React.ElementType
  color: string
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'dipendente',       email: 'marco.rossi@acme.it',   name: 'Marco Rossi',    icon: User,        color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  { role: 'azienda',          email: 'cfo.admin@acme.it',     name: 'Chiara Conti',   icon: Building2,   color: 'border-amber-200   hover:border-amber-400   hover:bg-amber-50'   },
  { role: 'gestore_flotta',   email: 'giulia.bianchi@ncc.it', name: 'Giulia Bianchi', icon: Truck,       color: 'border-violet-200  hover:border-violet-400  hover:bg-violet-50'  },
  { role: 'autista',          email: 'luca.ferrari@ncc.it',   name: 'Luca Ferrari',   icon: Car,         color: 'border-blue-200    hover:border-blue-400    hover:bg-blue-50'    },
  { role: 'supervisore_it',   email: 'admin.it@sistema.it',   name: 'Andrea Mancini', icon: ShieldCheck, color: 'border-red-200     hover:border-red-400     hover:bg-red-50'     },
  { role: 'customer_service', email: 'cs.support@ncc.it',     name: 'Sara Romano',    icon: Headphones,  color: 'border-cyan-200    hover:border-cyan-400    hover:bg-cyan-50'    },
]

const ROLE_ICON_COLORS: Record<UserRole, string> = {
  autista: 'text-blue-600',
  gestore_flotta: 'text-violet-600',
  azienda: 'text-amber-600',
  dipendente: 'text-emerald-600',
  supervisore_it: 'text-red-600',
  customer_service: 'text-cyan-600',
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('marco.rossi@acme.it')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const doLogin = async (loginEmail: string) => {
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 600))

    const company = mockCompanies[0]
    const user = company.employees.find((emp) => emp.email === loginEmail)

    if (!user || password !== 'demo1234') {
      setError('Credenziali non valide. Password: demo1234')
      setLoading(false)
      return
    }
    login(company, user)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await doLogin(email)
  }

  const handleDemoClick = (account: DemoAccount) => {
    setEmail(account.email)
    setPassword('demo1234')
    setError('')
    doLogin(account.email)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Car size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NCC & Taxi B2B</h1>
              <p className="text-brand-300 text-sm">Gestionale Aziendale</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Form login */}
          <div className="bg-white rounded-2xl shadow-2xl p-7 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Accesso</h2>
            <p className="text-sm text-gray-500 mb-5">Inserisci le tue credenziali</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="nome@azienda.it"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full">
                Accedi
              </Button>
            </form>
          </div>

          {/* Demo accounts */}
          <div>
            <p className="text-xs font-semibold text-brand-300 uppercase tracking-wide mb-2 px-0.5">
              Account demo — clicca per accedere
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => {
                const Icon = account.icon
                return (
                  <button
                    key={account.role}
                    onClick={() => handleDemoClick(account)}
                    disabled={loading}
                    className={clsx(
                      'flex items-center gap-3 w-full p-3 rounded-xl border-2 bg-white text-left transition-all',
                      account.color,
                      loading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Icon size={18} className={clsx('flex-shrink-0', ROLE_ICON_COLORS[account.role])} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{account.name}</p>
                      <p className="text-xs text-gray-500">{USER_ROLE_LABELS[account.role]}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-brand-400 text-center mt-3">
              Password universale: <strong className="text-brand-200">demo1234</strong>
            </p>
          </div>
        </div>

        <p className="text-center text-brand-300 text-xs mt-6">
          Collegato a App Gestionale 2 (modalità demo)
        </p>
      </div>
    </div>
  )
}
