import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { Phone, Clock, MapPin, Navigation, ChevronRight } from 'lucide-react'
import { RideStatusBadge } from '@/components/ui/Badge'
import ChatDrawer, { ChatButton } from '@/components/ui/ChatDrawer'
import CallOverlay from '@/components/ui/CallOverlay'
import { ridesApi } from '@/mocks/api/ridesApi'
import { driversApi } from '@/mocks/api/driversApi'
import type { Ride, Driver } from '@/types'
import { formatDateTime } from '@/utils/formatters'
import clsx from 'clsx'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function movingIcon(heading: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg)">
      <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

interface DriverPosition {
  driverId: string
  lat: number
  lng: number
  heading: number
  speed: number
}

export default function TrackingPage() {
  const { rideId } = useParams<{ rideId?: string }>()
  const navigate = useNavigate()
  const [rides, setRides] = useState<Ride[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [positions, setPositions] = useState<Record<string, DriverPosition>>({})
  const [selectedRideId, setSelectedRideId] = useState<string | null>(rideId ?? null)
  const [chatOpen, setChatOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)

  const refreshPositions = useCallback(async () => {
    const res = await driversApi.getAllPositions()
    const posMap: Record<string, DriverPosition> = {}
    res.data.forEach((p) => {
      posMap[p.driverId] = {
        driverId: p.driverId,
        lat: p.position.lat,
        lng: p.position.lng,
        heading: p.position.heading ?? 0,
        speed: p.position.speed ?? 0,
      }
    })
    setPositions(posMap)
  }, [])

  useEffect(() => {
    ridesApi.getActive().then((r) => setRides(r.data))
    driversApi.getAll({ companyId: 'comp-001' }).then((r) => setDrivers(r.data))
    refreshPositions()
    const interval = setInterval(refreshPositions, 3000)
    return () => clearInterval(interval)
  }, [refreshPositions])

  // Close chat/call when switching ride
  useEffect(() => {
    setChatOpen(false)
    setCallOpen(false)
  }, [selectedRideId])

  const selectedRide = rides.find((r) => r.id === selectedRideId)
  const selectedDriver = selectedRide?.driverId ? drivers.find((d) => d.id === selectedRide.driverId) : null
  const selectedPos = selectedRide?.driverId ? positions[selectedRide.driverId] : null
  const selectedDriverName = selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : 'Autista'

  const mapCenter: [number, number] = selectedPos
    ? [selectedPos.lat, selectedPos.lng]
    : [45.4654, 9.1866]

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Tracking Live</h2>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            {rides.length} corse attive · aggiornato ogni 3s
          </p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {rides.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Nessuna corsa attiva</div>
          ) : (
            rides.map((ride) => {
              const driver = drivers.find((d) => d.id === ride.driverId)
              const pos = ride.driverId ? positions[ride.driverId] : null
              return (
                <div
                  key={ride.id}
                  className={clsx('p-4 cursor-pointer transition-colors', selectedRideId === ride.id ? 'bg-brand-50 border-l-2 border-brand-500' : 'hover:bg-gray-50')}
                  onClick={() => setSelectedRideId(ride.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{ride.passengerName}</p>
                      <p className="text-xs text-gray-500">{ride.origin.label.split(',')[0]} → {ride.destination.label.split(',')[0]}</p>
                    </div>
                    <RideStatusBadge status={ride.status} />
                  </div>
                  {driver && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Navigation size={12} />
                      <span>{driver.firstName} {driver.lastName}</span>
                      {pos && <span>· {pos.speed} km/h</span>}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} key={mapCenter.join(',')}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OpenStreetMap' />
          {rides.map((ride) => {
            const pos = ride.driverId ? positions[ride.driverId] : null
            const driver = drivers.find((d) => d.id === ride.driverId)
            if (!pos) return null
            return (
              <Marker key={ride.id} position={[pos.lat, pos.lng]} icon={movingIcon(pos.heading)}>
                <Popup>
                  <div className="text-sm p-1">
                    <p className="font-semibold">{driver?.firstName} {driver?.lastName}</p>
                    <p className="text-gray-600">{ride.passengerName}</p>
                    <p className="text-gray-500">{pos.speed} km/h</p>
                    <button onClick={() => setSelectedRideId(ride.id)} className="text-brand-600 text-xs mt-1 flex items-center gap-1">
                      Dettagli <ChevronRight size={12} />
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {selectedRide && (
            <Polyline
              positions={[
                [selectedRide.origin.lat, selectedRide.origin.lng],
                [selectedRide.destination.lat, selectedRide.destination.lng],
              ]}
              color="#3b82f6"
              dashArray="8 6"
              weight={3}
            />
          )}
        </MapContainer>

        {/* Detail overlay for selected ride */}
        {selectedRide && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-200 max-w-md mx-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">{selectedRide.passengerName}</p>
                <RideStatusBadge status={selectedRide.status} />
              </div>
              <button onClick={() => navigate(`/prenotazione/${selectedRide.id}`)} className="text-xs text-brand-600 hover:underline">
                Dettaglio →
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin size={12} className="text-emerald-500" />
                <span className="truncate">{selectedRide.origin.label.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <MapPin size={12} className="text-red-500" />
                <span className="truncate">{selectedRide.destination.label.split(',')[0]}</span>
              </div>
              {selectedDriver && (
                <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
                  <Navigation size={12} />
                  <span>{selectedDriverName}</span>
                  {selectedPos && <span className="ml-1 text-gray-400">· {selectedPos.speed} km/h</span>}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock size={12} /> <span>{formatDateTime(selectedRide.scheduledAt)}</span>
              </div>
            </div>

            {/* Comunicazione autista */}
            {selectedRide.driverId && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <ChatButton
                  rideId={selectedRide.id}
                  driverId={selectedRide.driverId}
                  onClick={() => setChatOpen(true)}
                />
                <button
                  onClick={() => setCallOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone size={14} /> Chiama
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        rideId={selectedRide?.id ?? ''}
        driverId={selectedRide?.driverId ?? null}
        driverName={selectedDriverName}
        passengerName={selectedRide?.passengerName ?? ''}
        onCallRequest={() => { setChatOpen(false); setCallOpen(true) }}
      />

      <CallOverlay
        open={callOpen}
        onClose={() => setCallOpen(false)}
        driverName={selectedDriverName}
        driverPhone={selectedDriver?.phone ?? ''}
        vehiclePlate={selectedPos ? `${selectedPos.speed} km/h` : ''}
      />
    </div>
  )
}
