import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MapPin, User, Car, Clock, Banknote, Leaf, X, Phone, Star } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { RideStatusBadge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import ChatDrawer, { ChatButton } from '@/components/ui/ChatDrawer'
import CallOverlay from '@/components/ui/CallOverlay'
import RatingModal from '@/components/ui/RatingModal'
import { ridesApi } from '@/mocks/api/ridesApi'
import { mockDrivers } from '@/mocks/db/drivers'
import { mockVehicles } from '@/mocks/db/vehicles'
import type { Ride } from '@/types'
import { formatCurrency, formatDateTime, formatDistance, formatDuration } from '@/utils/formatters'
import { formatCO2 } from '@/utils/carbonFootprint'
import { useToasts } from '@/store/AppContext'

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useToasts()
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [ratingOpen, setRatingOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    ridesApi.getById(id).then((r) => setRide(r.data)).finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!id) return
    setCancelling(true)
    try {
      const r = await ridesApi.cancel(id)
      setRide(r.data)
      success('Corsa annullata')
      setCancelModal(false)
    } catch {
      showError("Errore durante l'annullamento")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <PageLoader />
  if (!ride) return <div className="text-center py-16 text-gray-500">Prenotazione non trovata</div>

  const driver = ride.driverId ? mockDrivers.find((d) => d.id === ride.driverId) : null
  const vehicle = ride.vehicleId ? mockVehicles.find((v) => v.id === ride.vehicleId) : null
  const canCancel = ['bozza', 'confermata', 'assegnata'].includes(ride.status)
  const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'Autista'

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={`Corsa ${ride.internalRef || ride.id}`}
        breadcrumbs={[{ label: 'Prenotazioni', to: '/prenotazione' }, { label: ride.internalRef || ride.id }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {ride.status === 'completata' && (
              <Button variant="outline" size="sm" onClick={() => setRatingOpen(true)}>
                <Star size={14} /> Valuta
              </Button>
            )}
            {ride.driverId && (
              <Button variant="outline" size="sm" onClick={() => setCallOpen(true)}>
                <Phone size={14} /> Chiama
              </Button>
            )}
            {ride.driverId && (
              <ChatButton rideId={ride.id} driverId={ride.driverId} onClick={() => setChatOpen(true)} />
            )}
            {canCancel && (
              <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
                <X size={14} /> Annulla corsa
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        {/* Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Stato prenotazione</p>
              <RideStatusBadge status={ride.status} />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Data/ora</p>
              <p className="font-semibold">{formatDateTime(ride.scheduledAt)}</p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Passenger */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-brand-500" />
              <h3 className="font-semibold text-gray-900">Passeggero</h3>
            </div>
            <p className="font-medium text-gray-900">{ride.passengerName}</p>
            <p className="text-sm text-gray-500">{ride.passengerPhone}</p>
            <p className="text-xs text-gray-400 mt-2">Rif: {ride.internalRef}</p>
          </Card>

          {/* Route */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-brand-500" />
              <h3 className="font-semibold text-gray-900">Percorso</h3>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{ride.origin.label}</p>
              </div>
              {ride.stops.map((stop, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{stop.label}</p>
                </div>
              ))}
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{ride.destination.label}</p>
              </div>
            </div>
          </Card>

          {/* Driver + Vehicle */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Car size={16} className="text-brand-500" />
              <h3 className="font-semibold text-gray-900">Autista e Veicolo</h3>
            </div>
            {driver ? (
              <div>
                <p className="font-medium text-gray-900">{driver.firstName} {driver.lastName}</p>
                <p className="text-sm text-gray-500">{driver.phone}</p>
                <p className="text-xs text-gray-400">NCC: {driver.nccAuthorizationNumber}</p>
              </div>
            ) : <p className="text-sm text-gray-400">Non ancora assegnato</p>}
            {vehicle && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="font-medium text-gray-900">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-gray-500">{vehicle.plate} · {vehicle.color}</p>
              </div>
            )}
          </Card>

          {/* Cost */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Banknote size={16} className="text-brand-500" />
              <h3 className="font-semibold text-gray-900">Costi e Distanza</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Distanza</span>
                <span className="font-medium">{formatDistance(ride.actualDistance ?? ride.estimatedDistance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Durata</span>
                <span className="font-medium">{formatDuration(ride.actualDuration ?? ride.estimatedDuration)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-700 font-medium">Totale</span>
                <span className="font-bold text-lg text-brand-700">{formatCurrency(ride.finalPrice ?? ride.estimatedPrice)}</span>
              </div>
              {ride.co2Grams && (
                <div className="flex justify-between items-center pt-1">
                  <span className="flex items-center gap-1 text-gray-500"><Leaf size={12} /> CO₂</span>
                  <span className="font-medium text-emerald-600">{formatCO2(ride.co2Grams)}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {ride.notes && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
            <p className="text-sm text-gray-600">{ride.notes}</p>
          </Card>
        )}
      </div>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Annulla Corsa">
        <p className="text-gray-600 mb-6">Sei sicuro di voler annullare questa prenotazione? L'operazione non può essere annullata.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setCancelModal(false)}>No, torna indietro</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>Sì, annulla corsa</Button>
        </div>
      </Modal>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        rideId={ride.id}
        driverId={ride.driverId ?? null}
        driverName={driverName}
        passengerName={ride.passengerName}
        onCallRequest={() => { setChatOpen(false); setCallOpen(true) }}
      />

      <CallOverlay
        open={callOpen}
        onClose={() => setCallOpen(false)}
        driverName={driverName}
        driverPhone={driver?.phone ?? ''}
        vehiclePlate={vehicle?.plate ?? ''}
      />

      <RatingModal
        open={ratingOpen}
        onClose={() => setRatingOpen(false)}
        rideId={ride.id}
        driverId={ride.driverId ?? ''}
        driverName={driverName}
        passengerId="passenger-001"
      />
    </div>
  )
}
