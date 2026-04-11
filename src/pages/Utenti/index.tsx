import { useState } from 'react'
import { UserPlus, Search, CheckCircle, XCircle } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useToasts } from '@/store/AppContext'
import { mockCompanies } from '@/mocks/db/companies'
import type { CompanyEmployee, UserRole } from '@/types'
import { USER_ROLE_LABELS } from '@/types'
import clsx from 'clsx'

const ROLE_BADGE: Record<UserRole, string> = {
  autista: 'bg-blue-100 text-blue-700',
  gestore_flotta: 'bg-violet-100 text-violet-700',
  azienda: 'bg-amber-100 text-amber-700',
  dipendente: 'bg-emerald-100 text-emerald-700',
  supervisore_it: 'bg-red-100 text-red-700',
  customer_service: 'bg-cyan-100 text-cyan-700',
}

const ALL_ROLES: UserRole[] = ['dipendente', 'azienda', 'gestore_flotta', 'autista', 'supervisore_it', 'customer_service']

interface NewUserForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: UserRole
}

const emptyForm: NewUserForm = { firstName: '', lastName: '', email: '', phone: '', role: 'dipendente' }

export default function UtentiPage() {
  const { success } = useToasts()
  const [users, setUsers] = useState<CompanyEmployee[]>([...mockCompanies[0].employees])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'tutti'>('tutti')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<NewUserForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || u.firstName.toLowerCase().includes(q)
      || u.lastName.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
    const matchRole = roleFilter === 'tutti' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleToggleActive = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    const newUser: CompanyEmployee = {
      id: `emp-${Date.now()}`,
      companyId: 'comp-001',
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || '-',
      costCenterId: 'cc-001',
      role: form.role,
      isActive: true,
    }
    setUsers((prev) => [...prev, newUser])
    mockCompanies[0].employees.push(newUser)
    success(`Utente ${newUser.firstName} ${newUser.lastName} creato con successo`)
    setForm(emptyForm)
    setModalOpen(false)
    setSaving(false)
  }

  return (
    <div>
      <PageHeader
        title="Gestione Utenti"
        subtitle={`${users.length} utenti registrati`}
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <UserPlus size={16} /> Nuovo utente
          </Button>
        }
      />

      {/* Filtri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter('tutti')}
            className={clsx('px-3 py-2 rounded-lg text-sm font-medium transition-colors', roleFilter === 'tutti' ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')}
          >
            Tutti
          </button>
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={clsx('px-3 py-2 rounded-lg text-sm font-medium transition-colors', roleFilter === r ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50')}
            >
              {USER_ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Tabella */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Utente</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Ruolo</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Stato</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', ROLE_BADGE[u.role])}>
                      {USER_ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {u.isActive
                      ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle size={13} /> Attivo</span>
                      : <span className="flex items-center gap-1 text-gray-400 text-xs font-medium"><XCircle size={13} /> Sospeso</span>
                    }
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.isActive ? 'Sospendi' : 'Riattiva'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">Nessun utente trovato</div>
          )}
        </div>
      </Card>

      {/* Modal nuovo utente */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuovo Utente" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="+39 333 0000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Annulla</Button>
            <Button type="submit" loading={saving}>Crea utente</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
