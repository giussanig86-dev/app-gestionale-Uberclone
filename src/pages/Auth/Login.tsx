import { useState } from 'react'
import { Car, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/store/AppContext'
import { mockCompanies } from '@/mocks/db/companies'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('marco.rossi@acme.it')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    await new Promise((r) => setTimeout(r, 800))

    const company = mockCompanies[0]
    const user = company.employees.find((emp) => emp.email === email)

    if (!user || password !== 'demo1234') {
      setError('Credenziali non valide. Prova: marco.rossi@acme.it / demo1234')
      setLoading(false)
      return
    }

    login(company, user)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Accesso</h2>
          <p className="text-sm text-gray-500 mb-6">Inserisci le credenziali della tua azienda</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email aziendale</label>
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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account demo</p>
            <p className="text-xs text-gray-600"><strong>Email:</strong> marco.rossi@acme.it</p>
            <p className="text-xs text-gray-600"><strong>Password:</strong> demo1234</p>
          </div>
        </div>

        <p className="text-center text-brand-300 text-xs mt-6">
          Collegato a App Gestionale 2 (modalità demo)
        </p>
      </div>
    </div>
  )
}
