import type { FuelType } from '@/types'

// ISPRA emission factors (g CO2/km)
export const CO2_PER_KM: Record<FuelType, number> = {
  benzina: 145,
  diesel: 132,
  ibrido: 89,
  elettrico: 47,  // lifecycle grid mix IT 2024
  gpl: 121,
}

// ACI 2023 average Italian car
const BASELINE_CO2_PER_KM = 160

export function calcCO2Grams(distanceKm: number, co2PerKm: number): number {
  return Math.round(distanceKm * co2PerKm)
}

export function calcCO2Saved(distanceKm: number, fuelType: FuelType): number {
  const actual = CO2_PER_KM[fuelType]
  const saved = (BASELINE_CO2_PER_KM - actual) * distanceKm
  return Math.max(0, Math.round(saved))
}

export function gramsToKg(grams: number): number {
  return Math.round(grams / 100) / 10
}

export function formatCO2(grams: number): string {
  if (grams < 1000) return `${grams} g CO₂`
  return `${gramsToKg(grams)} kg CO₂`
}
