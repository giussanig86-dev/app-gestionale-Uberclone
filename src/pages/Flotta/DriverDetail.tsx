import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Mail, Star, Car, Shield } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { DriverStatusBadge } from '@/components/ui/Badge'
import { mockDrivers } from '@/mocks/db/drivers'
import { mockVehicles } from '@/mocks/db/vehicles'
import { formatDate } from '@/utils/formatters'

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const driver = mockDrivers.find((d) => d.id === id)
  const vehicle = driver?.vehicleId ? mockVehicles.find((v) => v.id === driver.vehicleId) : null

  if (!driver) return <div className="text-center py-16 text-gray-500">Autista non trovato</div>

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={`${driver.firstName} ${driver.lastName}`}
        breadcrumbs={[{ label: 'Flotta', to: '/flotta' }, { label: 'Autisti' }, { label: `${driver.firstName} ${driver.lastName}` }]}
      />
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">
              {driver.firstName[0]}{driver.lastName[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{driver.firstName} {driver.lastName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <DriverStatusBadge status={driver.status} />
                <span className="text-sm text-amber-600 font-medium flex items-center gap-1"><Star size={14} /> {driver.rating}/5</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Phone size={14} /> {driver.phone}</div>
            <div className="flex items-center gap-2 text-gray-600"><Mail size={14} /> {driver.email}</div>
            <div className="flex items-center gap-2 text-gray-600"><Car size={14} /> {driver.totalRides} corse totali</div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield size={16} className="text-brand-500" /> Documenti e Autorizzazioni</h3>
          <div className="space-y-3 text-sm">
            <Row label="Codice Fiscale" value={driver.fiscalCode} />
            <Row label="Patente n." value={driver.licenseNumber} />
            <Row label="Categoria" value={driver.licenseCategory} />
            <Row label="Scadenza patente" value={formatDate(driver.licenseExpiry)} />
            <Row label="Autorizzazione NCC" value={driver.nccAuthorizationNumber} />
            {driver.taxiLicenseNumber && <Row label="Licenza Taxi" value={driver.taxiLicenseNumber} />}
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate(`/compliance/autisti/${driver.id}`)}>
            Vedi tutti i documenti →
          </Button>
        </Card>

        {vehicle && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Car size={16} className="text-brand-500" /> Veicolo Assegnato</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-gray-500">{vehicle.plate} · {vehicle.color} · {vehicle.year}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/flotta/veicoli/${vehicle.id}`)}>
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
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}
