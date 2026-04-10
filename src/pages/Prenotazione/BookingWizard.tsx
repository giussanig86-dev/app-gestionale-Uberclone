import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, User, MapPin, Car, ClipboardCheck } from 'lucide-react'
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
import clsx from 'clsx'

// --- Types ---
interface BookingFormData {
  passengerName: string
  passengerPhone: string
  passengerId: string
  internalRef: string
  costCenterId: string
  serviceType: ServiceType
  origin: string
  destination: string
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
  destination: '',
  scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  notes: '',
  vehicleId: '',
  driverId: '',
}

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

// Simple distance estimate (not real geo)
function estimateDistance(origin: string, dest: string): number {
  const seed = (origin.length + dest.length) % 50
  return Math.max(5, seed + 10)
}

function estimatePrice(distance: number, service: ServiceType): number {
  const base = service === 'ncc' ? 2.2 : service === 'taxi' ? 1.8 : 2.5
  return Math.round((distance * base + 8) * 100) / 100
}

export default function BookingWizard() {
  const navigate = useNavigate()
  const { company } = useAuth()
  const { success, error: showError } = useToasts()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<BookingFormData>(INITIAL)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof BookingFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const availableVehicles = mockVehicles.filter((v) => v.status === 'disponibile')
  const availableDrivers = mockDrivers.filter((d) => d.status === 'disponibile')
  const selectedVehicle = mockVehicles.find((v) => v.id === form.vehicleId)
  const selectedDriver = mockDrivers.find((d) => d.id === form.driverId)

  const distance = form.origin && form.destination ? estimateDistance(form.origin, form.destination) : 0
  const price = distance ? estimatePrice(distance, form.serviceType) : 0
  const co2 = selectedVehicle && distance ? calcCO2Grams(distance, selectedVehicle.co2PerKm) : 0

  const canProceed = (s: number) => {
    if (s === 1) return form.passengerName.trim() !== '' && form.costCenterId !== ''
    if (s === 2) return form.origin.trim() !== '' && form.destination.trim() !== '' && form.scheduledAt !== ''
    if (s === 3) return form.vehicleId !== '' && form.driverId !== ''
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const origin: RideWaypoint = { label: form.origin, lat: 45.4654 + Math.random() * 0.1, lng: 9.1866 + Math.random() * 0.1 }
      const destination: RideWaypoint = { label: form.destination, lat: 45.4654 + Math.random() * 0.1, lng: 9.1866 + Math.random() * 0.1 }
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
        estimatedDuration: Math.round(distance * 2),
        actualDuration: null,
        estimatedDistance: distance,
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
        {/* Step 1: Passenger */}
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

        {/* Step 2: Route */}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenza *</label>
              <input value={form.origin} onChange={(e) => set('origin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Via della Repubblica 15, Milano" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinazione *</label>
              <input value={form.destination} onChange={(e) => set('destination', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Aeroporto di Malpensa T1" />
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

        {/* Step 3: Vehicle */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Scegli Veicolo e Autista</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veicolo disponibile *</label>
              <div className="space-y-2">
                {availableVehicles.map((v) => (
                  <button key={v.id} onClick={() => set('vehicleId', v.id)}
                    className={clsx('w-full text-left p-4 rounded-xl border-2 transition-all',
                      form.vehicleId === v.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{v.brand} {v.model} <span className="text-gray-400 font-normal">— {v.plate}</span></p>
                        <p className="text-xs text-gray-500 mt-0.5">{v.seats} posti · {v.fuelType} · {v.year}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-emerald-600">{v.co2PerKm} g/km CO₂</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Autista disponibile *</label>
              <div className="space-y-2">
                {availableDrivers.map((d) => (
                  <button key={d.id} onClick={() => set('driverId', d.id)}
                    className={clsx('w-full text-left p-4 rounded-xl border-2 transition-all',
                      form.driverId === d.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{d.firstName} {d.lastName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">NCC: {d.nccAuthorizationNumber} · {d.totalRides} corse</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-600">★ {d.rating}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
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
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-brand-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Distanza stimata</p>
                <p className="text-xl font-bold text-brand-700">{distance} km</p>
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

        {/* Navigation */}
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
