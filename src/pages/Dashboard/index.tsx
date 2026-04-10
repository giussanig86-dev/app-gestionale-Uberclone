import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Users, Receipt, AlertTriangle, MapPin, Plus, ArrowRight, Leaf } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { RideStatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { ridesApi } from '@/mocks/api/ridesApi'
import { complianceApi } from '@/mocks/api/complianceApi'
import { mockVehicles } from '@/mocks/db/vehicles'
import type { Ride, ComplianceAlertSummary } from '@/types'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import { gramsToKg } from '@/utils/carbonFootprint'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [rides, setRides] = useState<Ride[]>([])
  const [compliance, setCompliance] = useState<ComplianceAlertSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      ridesApi.getAll({ companyId: 'comp-001' }),
      complianceApi.getAlertSummary('comp-001'),
    ]).then(([ridesRes, compRes]) => {
      setRides(ridesRes.data)
      setCompliance(compRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const activeRides = rides.filter((r) => r.status === 'in_corso' || r.status === 'assegnata')
  const completedRides = rides.filter((r) => r.status === 'completata')
  const totalRevenue = completedRides.reduce((s, r) => s + (r.finalPrice ?? 0), 0)
  const totalCO2 = completedRides.reduce((s, r) => s + (r.co2Grams ?? 0), 0)
  const availableVehicles = mockVehicles.filter((v) => v.status === 'disponibile').length
  const nonCompliantDrivers = compliance.filter((c) => c.overallStatus === 'non_compliant').length
  const recentRides = [...rides].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Panoramica operativa in tempo reale"
        actions={
          <Button onClick={() => navigate('/prenotazione/nuova')}>
            <Plus size={16} />
            Nuova prenotazione
          </Button>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Corse attive"
          value={activeRides.length}
          subtitle="In corso o assegnate"
          icon={Car}
          iconColor="text-brand-500"
          iconBg="bg-brand-50"
        />
        <StatCard
          title="Veicoli disponibili"
          value={`${availableVehicles}/${mockVehicles.length}`}
          subtitle="Pronti per il servizio"
          icon={Users}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Fatturato completato"
          value={formatCurrency(totalRevenue)}
          subtitle="Corse completate"
          icon={Receipt}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <StatCard
          title="CO₂ emessa"
          value={`${gramsToKg(totalCO2)} kg`}
          subtitle="Corse completate"
          icon={Leaf}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Alert Compliance */}
      {nonCompliantDrivers > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {nonCompliantDrivers} autist{nonCompliantDrivers > 1 ? 'i' : 'a'} con documenti scaduti o mancanti
            </p>
            <p className="text-xs text-red-600">Verifica la sezione Compliance per aggiornare i documenti</p>
          </div>
          <Button size="sm" variant="danger" onClick={() => navigate('/compliance')}>
            Verifica <ArrowRight size={14} />
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent rides */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 border-b border-gray-200">
            <CardHeader className="mb-0">
              <CardTitle>Prenotazioni recenti</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/prenotazione')}>
                Vedi tutte <ArrowRight size={14} />
              </Button>
            </CardHeader>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRides.map((ride) => (
              <div
                key={ride.id}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/prenotazione/${ride.id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Car size={14} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ride.passengerName}</p>
                  <p className="text-xs text-gray-500 truncate">{ride.origin.label} → {ride.destination.label}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <RideStatusBadge status={ride.status} />
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(ride.scheduledAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Active rides map preview */}
        <div className="space-y-4">
          <Card
            hover
            onClick={() => navigate('/tracking')}
          >
            <CardHeader>
              <CardTitle>Tracking Live</CardTitle>
              <MapPin size={16} className="text-brand-500" />
            </CardHeader>
            <div className="space-y-2">
              {activeRides.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nessuna corsa attiva</p>
              ) : (
                activeRides.map((ride) => (
                  <div key={ride.id} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="text-gray-700 truncate flex-1">{ride.passengerName}</span>
                    <RideStatusBadge status={ride.status} />
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-3 justify-center">
              Apri mappa <ArrowRight size={14} />
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
              <AlertTriangle size={16} className="text-amber-500" />
            </CardHeader>
            <div className="space-y-2">
              {compliance.slice(0, 4).map((c) => (
                <div key={c.driverId} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{c.driverName}</span>
                  <span className={
                    c.overallStatus === 'compliant' ? 'text-emerald-600 font-medium' :
                    c.overallStatus === 'warning' ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'
                  }>
                    {c.overallStatus === 'compliant' ? '✓ OK' :
                     c.overallStatus === 'warning' ? `⚠ ${c.expiringSoonCount} in scad.` :
                     `✗ ${c.expiredCount + c.missingCount} prob.`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
