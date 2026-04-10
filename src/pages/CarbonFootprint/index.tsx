import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Leaf, TrendingDown, Zap, Printer, ExternalLink } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { mockRides } from '@/mocks/db/rides'
import { mockVehicles } from '@/mocks/db/vehicles'
import { formatCO2, gramsToKg, CO2_PER_KM } from '@/utils/carbonFootprint'
import { formatCurrency } from '@/utils/formatters'
import type { FuelType } from '@/types'

const FUEL_LABELS: Record<FuelType, string> = { benzina: 'Benzina', diesel: 'Diesel', ibrido: 'Ibrido', elettrico: 'Elettrico', gpl: 'GPL' }
const FUEL_COLORS: Record<FuelType, string> = { benzina: '#ef4444', diesel: '#f59e0b', ibrido: '#10b981', elettrico: '#3b82f6', gpl: '#8b5cf6' }

const BASELINE_CO2_PER_KM = 160

export default function CarbonPage() {
  const completedRides = mockRides.filter((r) => r.status === 'completata' && r.co2Grams != null)

  const totalCO2 = completedRides.reduce((s, r) => s + (r.co2Grams ?? 0), 0)
  const totalKm = completedRides.reduce((s, r) => s + (r.actualDistance ?? r.estimatedDistance), 0)
  const avgCO2PerKm = totalKm > 0 ? totalCO2 / totalKm : 0
  const co2Saved = completedRides.reduce((s, r) => {
    const v = mockVehicles.find((v) => v.id === r.vehicleId)
    if (!v) return s
    const saved = (BASELINE_CO2_PER_KM - v.co2PerKm) * (r.actualDistance ?? r.estimatedDistance)
    return s + Math.max(0, saved)
  }, 0)

  // Bar chart: CO2 by ride
  const barData = completedRides.map((r) => ({
    name: r.passengerName.split(' ')[0],
    co2: gramsToKg(r.co2Grams ?? 0),
    distance: r.actualDistance ?? r.estimatedDistance,
  }))

  // Pie chart: CO2 by fuel type
  const fuelBreakdown = completedRides.reduce<Record<FuelType, number>>((acc, r) => {
    const v = mockVehicles.find((v) => v.id === r.vehicleId)
    if (!v) return acc
    acc[v.fuelType] = (acc[v.fuelType] ?? 0) + (r.co2Grams ?? 0)
    return acc
  }, {} as Record<FuelType, number>)

  const pieData = Object.entries(fuelBreakdown).map(([fuel, grams]) => ({
    name: FUEL_LABELS[fuel as FuelType],
    value: gramsToKg(grams),
    color: FUEL_COLORS[fuel as FuelType],
  }))

  const emissionFactors = Object.entries(CO2_PER_KM).map(([fuel, grams]) => ({
    fuel: FUEL_LABELS[fuel as FuelType],
    grams,
    color: FUEL_COLORS[fuel as FuelType],
  }))

  return (
    <div>
      <PageHeader
        title="Carbon Footprint"
        subtitle="Monitoraggio emissioni CO₂ flotta aziendale"
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer size={14} /> Esporta report
          </Button>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="CO₂ totale emessa" value={`${gramsToKg(totalCO2)} kg`} subtitle={completedRides.length + ' corse'} icon={Leaf} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Media per corsa" value={`${Math.round(totalCO2 / Math.max(completedRides.length, 1) / 100) / 10} kg`} subtitle="Emissione media" icon={TrendingDown} iconColor="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Km percorsi" value={`${Math.round(totalKm)} km`} subtitle="Distanza totale" icon={Zap} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <StatCard title="CO₂ risparmiata" value={`${gramsToKg(co2Saved)} kg`} subtitle="vs auto media italiana" icon={Leaf} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={{ value: -Math.round(co2Saved / Math.max(totalCO2 + co2Saved, 1) * 100), label: 'risparmio' }} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>CO₂ per corsa (kg)</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} kg CO₂`, 'CO₂']} />
              <Bar dataKey="co2" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>CO₂ per tipo carburante</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} kg CO₂`]} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Emission factors table */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fattori emissione (ISPRA Italia)</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {emissionFactors.map((ef) => (
              <div key={ef.fuel} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ef.color }} />
                <span className="flex-1 text-sm text-gray-700">{ef.fuel}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(ef.grams / 175) * 100}%`, background: ef.color }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">{ef.grams} g/km</span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-400" />
              <span className="flex-1 text-sm text-gray-500">Auto media IT (ACI 2023)</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full bg-gray-400" style={{ width: `${(BASELINE_CO2_PER_KM / 175) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-500 w-20 text-right">{BASELINE_CO2_PER_KM} g/km</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compensazione CO₂</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-sm font-semibold text-emerald-800 mb-1">CO₂ da compensare</p>
              <p className="text-2xl font-bold text-emerald-700">{formatCO2(totalCO2)}</p>
              <p className="text-xs text-emerald-600 mt-1">
                Stima costo compensazione: <strong>{formatCurrency(gramsToKg(totalCO2) * 0.015)}</strong> (a 15€/tCO₂)
              </p>
            </div>
            <p className="text-sm text-gray-600 font-medium">Partner per la compensazione:</p>
            {[
              { name: 'Myclimate Foundation', desc: 'Gold Standard certified offsets' },
              { name: 'Climate Partner', desc: 'Corporate carbon offsetting' },
              { name: 'South Pole', desc: 'Nature-based solutions' },
            ].map((partner) => (
              <div key={partner.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-brand-300 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{partner.name}</p>
                  <p className="text-xs text-gray-500">{partner.desc}</p>
                </div>
                <ExternalLink size={14} className="text-gray-400" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
