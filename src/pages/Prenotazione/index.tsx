import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { RideStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { ridesApi } from '@/mocks/api/ridesApi'
import type { Ride, RideStatus } from '@/types'
import { formatCurrency, formatDateTime, formatDistance } from '@/utils/formatters'
import { Car } from 'lucide-react'

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ncc: 'NCC',
  taxi: 'Taxi',
  transfer_aeroporto: 'Transfer Aeroporto',
  transfer_fiera: 'Transfer Fiera',
}

const STATUS_FILTERS: { value: RideStatus | 'tutti'; label: string }[] = [
  { value: 'tutti', label: 'Tutti' },
  { value: 'in_corso', label: 'In corso' },
  { value: 'assegnata', label: 'Assegnata' },
  { value: 'confermata', label: 'Confermata' },
  { value: 'completata', label: 'Completata' },
  { value: 'annullata', label: 'Annullata' },
]

export default function PrenotazionePage() {
  const navigate = useNavigate()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RideStatus | 'tutti'>('tutti')

  useEffect(() => {
    ridesApi.getAll({ companyId: 'comp-001' }).then((r) => setRides(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = rides.filter((r) => {
    const matchStatus = statusFilter === 'tutti' || r.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || r.passengerName.toLowerCase().includes(q) || r.internalRef.toLowerCase().includes(q) || r.origin.label.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Prenotazioni"
        subtitle={`${rides.length} corse totali`}
        actions={
          <Button onClick={() => navigate('/prenotazione/nuova')}>
            <Plus size={16} />
            Nuova prenotazione
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per passeggero, riferimento..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === f.value ? 'bg-brand-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Car} title="Nessuna prenotazione trovata" description="Modifica i filtri o crea una nuova prenotazione" action={{ label: 'Nuova prenotazione', onClick: () => navigate('/prenotazione/nuova') }} />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Passeggero</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Percorso</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Data/ora</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Importo</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Stato</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((ride) => (
                  <tr
                    key={ride.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/prenotazione/${ride.id}`)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{ride.passengerName}</p>
                      <p className="text-xs text-gray-500">{ride.internalRef}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-800 truncate max-w-xs">{ride.origin.label.split(',')[0]}</p>
                      <p className="text-xs text-gray-500">→ {ride.destination.label.split(',')[0]}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 whitespace-nowrap">{formatDateTime(ride.scheduledAt)}</td>
                    <td className="px-5 py-4 text-gray-600">{SERVICE_TYPE_LABELS[ride.serviceType]}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {ride.finalPrice != null ? formatCurrency(ride.finalPrice) : formatCurrency(ride.estimatedPrice)}
                      {ride.finalPrice == null && <span className="text-xs text-gray-400 ml-1">(est.)</span>}
                    </td>
                    <td className="px-5 py-4"><RideStatusBadge status={ride.status} /></td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="sm">Dettagli</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
