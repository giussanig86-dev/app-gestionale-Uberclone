import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Users, Truck, AlertTriangle, Wrench } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import { DriverStatusBadge, VehicleStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { driversApi } from '@/mocks/api/driversApi'
import { vehiclesApi } from '@/mocks/api/vehiclesApi'
import type { Driver, Vehicle } from '@/types'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const statusColor: Record<string, string> = {
  disponibile: '#10b981',
  in_corsa: '#3b82f6',
  offline: '#6b7280',
  pausa: '#f59e0b',
}

function driverIcon(status: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${statusColor[status] ?? '#6b7280'};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

export default function FlottaPage() {
  const navigate = useNavigate()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    driversApi.getAll({ companyId: 'comp-001' }).then((r) => setDrivers(r.data))
    vehiclesApi.getAll({ companyId: 'comp-001' }).then((r) => setVehicles(r.data))
  }, [])

  const activeDrivers = drivers.filter((d) => d.status !== 'offline')
  const inRideDrivers = drivers.filter((d) => d.status === 'in_corsa')
  const availableVehicles = vehicles.filter((v) => v.status === 'disponibile')
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'manutenzione')
  const mapDrivers = drivers.filter((d) => d.currentPosition)

  return (
    <div>
      <PageHeader title="Gestione Flotta" subtitle="Veicoli e autisti in tempo reale" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Autisti attivi" value={activeDrivers.length} subtitle={`${inRideDrivers.length} in corsa`} icon={Users} iconColor="text-brand-500" iconBg="bg-brand-50" />
        <StatCard title="Veicoli disponibili" value={availableVehicles.length} subtitle={`di ${vehicles.length} totali`} icon={Truck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="In manutenzione" value={maintenanceVehicles.length} subtitle="Fuori servizio" icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="Offline" value={drivers.filter((d) => d.status === 'offline').length} subtitle="Non disponibili" icon={AlertTriangle} iconColor="text-gray-500" iconBg="bg-gray-50" />
      </div>

      {/* Map */}
      <Card padding="none" className="mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Posizioni in tempo reale</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tracking')}>Apri tracking →</Button>
        </div>
        <MapContainer center={[45.4654, 9.1866]} zoom={12} style={{ height: '320px', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          {mapDrivers.map((driver) => (
            driver.currentPosition && (
              <Marker key={driver.id} position={[driver.currentPosition.lat, driver.currentPosition.lng]} icon={driverIcon(driver.status)}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{driver.firstName} {driver.lastName}</p>
                    <p className="text-gray-500">{driver.status === 'in_corsa' ? 'In corsa' : 'Disponibile'}</p>
                    <p className="text-gray-500">{driver.currentPosition.speed ?? 0} km/h</p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Drivers */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Autisti</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {drivers.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/flotta/autisti/${d.id}`)}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: statusColor[d.status] ?? '#6b7280' }}>
                  {d.firstName[0]}{d.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{d.firstName} {d.lastName}</p>
                  <p className="text-xs text-gray-500">★ {d.rating} · {d.totalRides} corse</p>
                </div>
                <DriverStatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Vehicles */}
        <Card padding="none">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Veicoli</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/flotta/veicoli/${v.id}`)}>
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Truck size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{v.brand} {v.model}</p>
                  <p className="text-xs text-gray-500">{v.plate} · {v.fuelType} · {v.seats} posti</p>
                </div>
                <VehicleStatusBadge status={v.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
