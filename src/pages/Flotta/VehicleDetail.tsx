import { useParams, useNavigate } from 'react-router-dom'
import { Truck, Shield, Leaf, Wrench } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { VehicleStatusBadge } from '@/components/ui/Badge'
import { mockVehicles } from '@/mocks/db/vehicles'
import { mockDrivers } from '@/mocks/db/drivers'
import { formatDate, formatDistance } from '@/utils/formatters'

const FUEL_LABELS: Record<string, string> = { benzina: 'Benzina', diesel: 'Diesel', ibrido: 'Ibrido', elettrico: 'Elettrico', gpl: 'GPL' }
const TYPE_LABELS: Record<string, string> = { berlina: 'Berlina', monovolume: 'Monovolume', suv: 'SUV', minibus: 'Minibus', taxi: 'Taxi' }

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const vehicle = mockVehicles.find((v) => v.id === id)
  const driver = vehicle?.assignedDriverId ? mockDrivers.find((d) => d.id === vehicle.assignedDriverId) : null

  if (!vehicle) return <div className="text-center py-16 text-gray-500">Veicolo non trovato</div>

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        breadcrumbs={[{ label: 'Flotta', to: '/flotta' }, { label: 'Veicoli' }, { label: vehicle.plate }]}
      />
      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{vehicle.brand} {vehicle.model} {vehicle.year}</h3>
              <p className="text-gray-500">{vehicle.plate} · {vehicle.color}</p>
            </div>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Tipo</p>
              <p className="font-semibold text-gray-900">{TYPE_LABELS[vehicle.type]}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Carburante</p>
              <p className="font-semibold text-gray-900">{FUEL_LABELS[vehicle.fuelType]}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Posti</p>
              <p className="font-semibold text-gray-900">{vehicle.seats}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-brand-500" /> Documenti</h3>
            <div className="space-y-2 text-sm">
              <Row label="Assicurazione RC" value={formatDate(vehicle.insuranceExpiry)} />
              <Row label="Revisione" value={formatDate(vehicle.revisioneExpiry)} />
              <Row label="Auth. NCC targa" value={formatDate(vehicle.nccPlateAuthExpiry)} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Wrench size={16} className="text-brand-500" /> Manutenzione</h3>
            <div className="space-y-2 text-sm">
              <Row label="Km totali" value={formatDistance(vehicle.mileage)} />
              <Row label="Ultimo tagliando" value={formatDate(vehicle.lastServiceDate)} />
              <Row label="Prossimo a" value={formatDistance(vehicle.nextServiceKm)} />
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Leaf size={16} className="text-emerald-500" /> Emissioni</h3>
          <div className="flex items-center gap-6">
            <div className="bg-emerald-50 rounded-xl px-6 py-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{vehicle.co2PerKm}</p>
              <p className="text-xs text-gray-500 mt-1">g CO₂/km (WLTP)</p>
            </div>
            <p className="text-sm text-gray-600">
              Emissioni {vehicle.co2PerKm === 0 ? 'zero' : vehicle.co2PerKm < 100 ? 'basse' : vehicle.co2PerKm < 140 ? 'medie' : 'alte'} per il tipo di carburante <strong>{FUEL_LABELS[vehicle.fuelType]}</strong>.
            </p>
          </div>
        </Card>

        {driver && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Truck size={16} className="text-brand-500" /> Autista Assegnato</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{driver.firstName} {driver.lastName}</p>
                <p className="text-sm text-gray-500">{driver.phone}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/flotta/autisti/${driver.id}`)}>
                Dettagli →
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
