import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, User, MapPin, Car, ClipboardCheck, Navigation, Star, Leaf, Clock, Zap } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAuth, useToasts } from '@/store/AppContext'
import { ridesApi } from '@/mocks/api/ridesApi'
import { mockVehicles } from '@/mocks/db/vehicles'
import { mockDrivers } from '@/mocks/db/drivers'
import type { ServiceType, RideWaypoint } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { calcCO2Grams, formatCO2 } from '@/utils/carbonFootprint'
import {
  findNearestVehicles,
  geocodeAddress,
  haversineKm,
  type NearestVehicleResult,
} from '@/utils/geoDistance'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────────────────
// Tipi e costanti
// ─────────────────────────────────────────────────────────────────────────────

interface BookingFormData {
  passengerName: string
  passengerPhone: string
  passengerId: string
  internalRef: string
  costCenterId: string
  serviceType: ServiceType
  origin: string
  originLat: number | null
  originLng: number | null
  destination: string
  destinationLat: number | null
  destinationLng: number | null
  scheduledAt: string
  notes: string
  vehicleId: string
  driverId: string
}

const INITIAL: BookingFormData = {
  passengerName: '',
  passengerPhone: '',
  passengerId: '',
  internalRef: '',
  costCenterId: '',
  serviceType: 'ncc',
  origin: '',
  originLat: null,
  originLng: null,
  destination: '',
  destinationLat: null,
  destinationLng: null,
  scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  notes: '',
  vehicleId: '',
  driverId: '',
}

// Centro di Milano come fallback quando il geocoding non è ancora disponibile
const MILAN_CENTER = { lat: 45.4654, lng: 9.1866 }

const STEPS = [
  { id: 1, label: 'Passeggero', icon: User },
  { id: 2, label: 'Percorso', icon: MapPin },
  { id: 3, label: 'Veicolo', icon: Car },
  { id: 4, label: 'Conferma', icon: ClipboardCheck },
]

const SERVICE_TYPES: { value: ServiceType; label: string; desc: string }[] = [
  { value: 'ncc', label: 'NCC', desc: 'Noleggio Con Conducente' },
  { value: 'taxi', label: 'Taxi', desc: 'Servizio taxi' },
  { value: 'transfer_aeroporto', label: 'Transfer Aeroporto', desc: 'Trasferimento aeroportuale' },
  { value: 'transfer_fiera', label: 'Transfer Fiera', desc: 'Servizio fieristico' },
]

function estimatePrice(distanceKm: number, service: ServiceType): number {
  const basePerKm = service === 'ncc' ? 2.2 : service === 'taxi' ? 1.8 : 2.5
  return Math.round((distanceKm * basePerKm + 8) * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────────────────────

export default function BookingWizard() {
  const navigate = useNavigate()
  const { company } = useAuth()
  const { success, error: showError } = useToasts()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<BookingFormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  // Stato geocoding
  const [geocodingOrigin, setGeocodingOrigin] = useState(false)
  const [geocodingDest, setGeocodingDest] = useState(false)
  const originTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const destTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ranking veicoli vicini (calcolato in Step 3)
  const [ranking, setRanking] = useState<NearestVehicleResult[]>([])

  const set = (key: keyof BookingFormData, value: string | number | null) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // ── Geocoding debounced: attende 800ms dopo l'ultimo carattere digitato ──

  const handleOriginChange = (value: string) => {
    set('origin', value)
    set('originLat', null)
    set('originLng', null)
    if (originTimer.current) clearTimeout(originTimer.current)
    if (value.length < 5) return
    originTimer.current = setTimeout(async () => {
      setGeocodingOrigin(true)
      const coords = await geocodeAddress(value)
      setGeocodingOrigin(false)
      if (coords) {
        set('originLat', coords.lat)
        set('originLng', coords.lng)
      }
    }, 800)
  }

  const handleDestChange = (value: string) => {
    set('destination', value)
    set('destinationLat', null)
    set('destinationLng', null)
    if (destTimer.current) clearTimeout(destTimer.current)
    if (value.length < 5) return
    destTimer.current = setTimeout(async () => {
      setGeocodingDest(true)
      const coords = await geocodeAddress(value)
      setGeocodingDest(false)
      if (coords) {
        set('destinationLat', coords.lat)
        set('destinationLng', coords.lng)
      }
    }, 800)
  }

  // ── Calcola ranking quando si arriva allo Step 3 ──
  useEffect(() => {
    if (step !== 3) return
    const pickupLat = form.originLat ?? MILAN_CENTER.lat
    const pickupLng = form.originLng ?? MILAN_CENTER.lng
    const results = findNearestVehicles(pickupLat, pickupLng, mockDrivers, mockVehicles)
    setRanking(results)
    // Auto-seleziona il più vicino se non c'è già una scelta
    if (results.length > 0 && !form.vehicleId) {
      set('vehicleId', results[0].vehicle.id)
      set('driverId', results[0].driver.id)
    }
  }, [step])

  // ── Distanza corsa ──
  const routeDistanceKm: number = (() => {
    if (form.originLat && form.originLng && form.destinationLat && form.destinationLng) {
      return Math.round(haversineKm(form.originLat, form.originLng, form.destinationLat, form.destinationLng) * 10) / 10
    }
    // fallback euristico se geocoding non disponibile
    const seed = (form.origin.length + form.destination.length) % 50
    return Math.max(5, seed + 10)
  })()

  const selectedVehicle = mockVehicles.find((v) => v.id === form.vehicleId)
  const selectedDriver = mockDrivers.find((d) => d.id === form.driverId)
  const price = routeDistanceKm ? estimatePrice(routeDistanceKm, form.serviceType) : 0
  const co2 = selectedVehicle && routeDistanceKm ? calcCO2Grams(routeDistanceKm, selectedVehicle.co2PerKm) : 0

  const canProceed = (s: number) => {
    if (s === 1) return form.passengerName.trim() !== '' && form.costCenterId !== ''
    if (s === 2) return form.origin.trim() !== '' && form.destination.trim() !== '' && form.scheduledAt !== ''
    if (s === 3) return form.vehicleId !== '' && form.driverId !== ''
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const origin: RideWaypoint = {
        label: form.origin,
        lat: form.originLat ?? MILAN_CENTER.lat,
        lng: form.originLng ?? MILAN_CENTER.lng,
      }
      const destination: RideWaypoint = {
        label: form.destination,
        lat: form.destinationLat ?? MILAN_CENTER.lat + 0.05,
        lng: form.destinationLng ?? MILAN_CENTER.lng + 0.05,
      }
      const result = await ridesApi.create({
        companyId: 'comp-001',
        costCenterId: form.costCenterId,
        serviceType: form.serviceType,
        status: form.driverId ? 'assegnata' : 'confermata',
        passengerId: form.passengerId || 'emp-001',
        passengerName: form.passengerName,
        passengerPhone: form.passengerPhone,
        driverId: form.driverId || null,
        vehicleId: form.vehicleId || null,
        origin,
        destination,
        stops: [],
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        startedAt: null,
        completedAt: null,
        estimatedDuration: Math.round(routeDistanceKm * 2.2),
        actualDuration: null,
        estimatedDistance: routeDistanceKm,
        actualDistance: null,
        estimatedPrice: price,
        finalPrice: null,
        co2Grams: null,
        invoiceId: null,
        notes: form.notes,
        internalRef: form.internalRef || `PO-${Date.now()}`,
        createdBy: 'emp-001',
      })
      success('Prenotazione creata con successo!')
      navigate(`/prenotazione/${result.data.id}`)
    } catch {
      showError('Errore nella creazione della prenotazione')
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Nuova Prenotazione"
        breadcrumbs={[{ label: 'Prenotazioni', to: '/prenotazione' }, { label: 'Nuova' }]}
      />

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                step > s.id ? 'bg-emerald-500 text-white' :
                step === s.id ? 'bg-brand-500 text-white' :
                'bg-gray-200 text-gray-500'
              )}>
                {step > s.id ? <Check size={18} /> : <s.icon size={18} />}
              </div>
              <span className={clsx('text-xs mt-1 font-medium', step === s.id ? 'text-brand-600' : 'text-gray-400')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-2 mt-[-16px]', step > s.id ? 'bg-emerald-400' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* ── Step 1: Passeggero ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Dati Passeggero</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome passeggero *</label>
                <input value={form.passengerName} onChange={(e) => set('passengerName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Nome Cognome" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input value={form.passengerPhone} onChange={(e) => set('passengerPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="+39 333 1234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centro di costo *</label>
                <select value={form.costCenterId} onChange={(e) => set('costCenterId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seleziona...</option>
                  {company?.costCenters.map((cc) => (
                    <option key={cc.id} value={cc.id}>{cc.code} — {cc.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Riferimento interno / PO</label>
                <input value={form.internalRef} onChange={(e) => set('internalRef', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="PO-2025-0001" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Percorso con geocoding ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Percorso e Servizio</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo servizio</label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((st) => (
                  <button key={st.value} onClick={() => set('serviceType', st.value)}
                    className={clsx('text-left p-3 rounded-lg border-2 transition-all',
                      form.serviceType === st.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    <p className="font-medium text-sm text-gray-900">{st.label}</p>
                    <p className="text-xs text-gray-500">{st.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Partenza con geocoding */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenza *</label>
              <div className="relative">
                <input
                  value={form.origin}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  className={clsx(
                    'w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
                    form.originLat ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'
                  )}
                  placeholder="Via della Repubblica 15, Milano"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {geocodingOrigin ? (
                    <svg className="animate-spin w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : form.originLat ? (
                    <Navigation size={14} className="text-emerald-600" />
                  ) : null}
                </div>
              </div>
              {form.originLat && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Navigation size={10} /> Posizione rilevata: {form.originLat.toFixed(5)}, {form.originLng?.toFixed(5)}
                </p>
              )}
            </div>

            {/* Destinazione con geocoding */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinazione *</label>
              <div className="relative">
                <input
                  value={form.destination}
                  onChange={(e) => handleDestChange(e.target.value)}
                  className={clsx(
                    'w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500',
                    form.destinationLat ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300'
                  )}
                  placeholder="Aeroporto di Malpensa T1"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {geocodingDest ? (
                    <svg className="animate-spin w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : form.destinationLat ? (
                    <Navigation size={14} className="text-emerald-600" />
                  ) : null}
                </div>
              </div>
              {form.destinationLat && form.originLat && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Navigation size={10} /> Distanza corsa: ~{routeDistanceKm} km
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e ora *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Volo AZ1234, ore 11:30..." />
            </div>
          </div>
        )}

        {/* ── Step 3: Veicolo più vicino (algoritmo Haversine) ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Veicolo e Autista</h3>
              {form.originLat ? (
                <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                  <Navigation size={10} /> Ordinati per distanza da te
                </span>
              ) : (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Navigation size={10} /> Posizione approssimata (Milano)
                </span>
              )}
            </div>

            {ranking.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nessun veicolo disponibile al momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ranking.map((r, idx) => {
                  const isSelected = form.vehicleId === r.vehicle.id
                  return (
                    <button
                      key={r.vehicle.id}
                      onClick={() => { set('vehicleId', r.vehicle.id); set('driverId', r.driver.id) }}
                      className={clsx(
                        'w-full text-left rounded-xl border-2 transition-all overflow-hidden',
                        isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      {/* Badge posizione ranking */}
                      <div className={clsx(
                        'flex items-center gap-2 px-4 py-1.5 text-xs font-semibold',
                        r.isNearest ? 'bg-emerald-500 text-white' :
                        idx === 1 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-500'
                      )}>
                        {r.isNearest ? (
                          <><Zap size={12} /> Più vicino — arriva in ~{r.etaMinutes} min</>
                        ) : (
                          <><Clock size={12} /> #{idx + 1} — ~{r.etaMinutes} min di attesa</>
                        )}
                      </div>

                      <div className="p-4">
                        {/* Veicolo */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {r.vehicle.brand} {r.vehicle.model}
                              <span className="text-gray-400 font-normal text-sm ml-2">— {r.vehicle.plate}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {r.vehicle.seats} posti · {r.vehicle.fuelType} · {r.vehicle.year}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                              <Leaf size={10} /> {r.vehicle.co2PerKm} g/km CO₂
                            </p>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-100 my-3" />

                        {/* Autista + distanza */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                              {r.driver.firstName[0]}{r.driver.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {r.driver.firstName} {r.driver.lastName}
                              </p>
                              <p className="text-xs text-gray-400">{r.driver.totalRides} corse</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-right">
                            {/* Rating */}
                            <div className="flex items-center gap-0.5">
                              <Star size={12} className="text-amber-400 fill-amber-400" />
                              <span className="text-sm font-semibold text-gray-700">{r.driver.rating}</span>
                            </div>
                            {/* Distanza autista → pickup */}
                            <div className="bg-gray-100 rounded-lg px-2.5 py-1 text-center">
                              <p className="text-xs font-bold text-gray-800">{r.distanceKm} km</p>
                              <p className="text-[10px] text-gray-400 leading-none">da te</p>
                            </div>
                          </div>
                        </div>

                        {/* Score bar (visivo) */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={clsx('h-1.5 rounded-full', r.isNearest ? 'bg-emerald-500' : 'bg-brand-300')}
                              style={{ width: `${Math.round((1 - r.score) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            score {Math.round((1 - r.score) * 100)}%
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Conferma ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Riepilogo Prenotazione</h3>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
              <Row label="Passeggero" value={form.passengerName} />
              <Row label="Telefono" value={form.passengerPhone || '—'} />
              <Row label="Centro di costo" value={company?.costCenters.find((c) => c.id === form.costCenterId)?.name ?? '—'} />
              <Row label="Tipo servizio" value={SERVICE_TYPES.find((s) => s.value === form.serviceType)?.label ?? '—'} />
              <Row label="Partenza" value={form.origin} />
              <Row label="Destinazione" value={form.destination} />
              <Row label="Data/ora" value={new Date(form.scheduledAt).toLocaleString('it-IT')} />
              <Row label="Veicolo" value={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.plate})` : '—'} />
              <Row label="Autista" value={selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : '—'} />
              {(() => {
                const ranked = ranking.find((r) => r.vehicle.id === form.vehicleId)
                return ranked ? (
                  <>
                    <Row label="Distanza autista → pickup" value={`${ranked.distanceKm} km`} />
                    <Row label="ETA stimato autista" value={`~${ranked.etaMinutes} min`} />
                  </>
                ) : null
              })()}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Distanza corsa</p>
                <p className="text-xl font-bold text-brand-700">{routeDistanceKm} km</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Prezzo stimato</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(price)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">CO₂ stimata</p>
                <p className="text-xl font-bold text-amber-700">{formatCO2(co2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigazione */}
        <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate('/prenotazione')}>
            {step === 1 ? 'Annulla' : '← Indietro'}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed(step)}>
              Avanti →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              <Check size={16} /> Conferma prenotazione
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  )
}
