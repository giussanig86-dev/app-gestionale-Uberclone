import type { Driver, Vehicle } from '@/types'

const EARTH_RADIUS_KM = 6371
const AVG_URBAN_SPEED_KMH = 28   // velocità media urbana Milano
const AVG_HIGHWAY_SPEED_KMH = 80

// ─────────────────────────────────────────────────────────────────────────────
// HAVERSINE — distanza in km tra due coordinate GPS
// Usa la formula della grande cerchio (great-circle distance)
// Accuratezza: ±0.5% rispetto alla distanza reale su strade
// ─────────────────────────────────────────────────────────────────────────────
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

// ─────────────────────────────────────────────────────────────────────────────
// ETA — stima minuti di arrivo al punto di pickup
// Per distanze > 5 km assume percorso misto urbano/extraurbano
// ─────────────────────────────────────────────────────────────────────────────
export function etaMinutes(distanceKm: number): number {
  const speedKmh = distanceKm > 5
    ? AVG_URBAN_SPEED_KMH * 0.4 + AVG_HIGHWAY_SPEED_KMH * 0.6
    : AVG_URBAN_SPEED_KMH
  return Math.ceil((distanceKm / speedKmh) * 60)
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING PONDERATO
// score = 0.70 × distanza_norm + 0.30 × (1 − rating_norm)
// → valore basso = candidato migliore
// La distanza ha peso 70%, il rating 30%
// ─────────────────────────────────────────────────────────────────────────────
function weightedScore(
  distanceKm: number,
  maxDistanceKm: number,
  rating: number,          // 0–5
): number {
  const wDistance = 0.70
  const wRating   = 0.30

  const distNorm   = maxDistanceKm > 0 ? distanceKm / maxDistanceKm : 0
  const ratingNorm = rating / 5                    // 5 = massimo
  const ratingPenalty = 1 - ratingNorm             // basso = penalità bassa = meglio

  return wDistance * distNorm + wRating * ratingPenalty
}

// ─────────────────────────────────────────────────────────────────────────────
// RISULTATO RANKING
// ─────────────────────────────────────────────────────────────────────────────
export interface NearestVehicleResult {
  driver: Driver
  vehicle: Vehicle
  distanceKm: number       // km lineari autista → pickup (Haversine)
  etaMinutes: number       // minuti stimati di arrivo
  score: number            // score ponderato (più basso = migliore)
  isNearest: boolean       // true solo per il primo in classifica
}

// ─────────────────────────────────────────────────────────────────────────────
// ALGORITMO PRINCIPALE
// Input:  punto di pickup + lista autisti disponibili + lista veicoli
// Output: lista ordinata per score, dalla migliore alla peggiore opzione
//
// Passaggi:
//  1. Filtra solo autisti disponibili con posizione GPS nota
//  2. Risolve il veicolo assegnato a ciascun autista
//  3. Calcola distanza Haversine (autista → pickup)
//  4. Calcola ETA stimato
//  5. Normalizza le distanze sul massimo trovato
//  6. Calcola score ponderato per ciascuna coppia
//  7. Ordina per score crescente (il migliore è il primo)
// ─────────────────────────────────────────────────────────────────────────────
export function findNearestVehicles(
  pickupLat: number,
  pickupLng: number,
  drivers: Driver[],
  vehicles: Vehicle[],
): NearestVehicleResult[] {
  // 1+2 — filtra e risolve veicolo
  const candidates = drivers
    .filter((d) => d.status === 'disponibile' && d.currentPosition !== null && d.vehicleId !== null)
    .flatMap((driver) => {
      const vehicle = vehicles.find(
        (v) => v.id === driver.vehicleId && v.status === 'disponibile'
      )
      if (!vehicle || !driver.currentPosition) return []
      return [{ driver, vehicle }]
    })

  if (candidates.length === 0) return []

  // 3 — distanza Haversine per tutti i candidati
  const withDistance = candidates.map(({ driver, vehicle }) => ({
    driver,
    vehicle,
    distanceKm: haversineKm(
      driver.currentPosition!.lat,
      driver.currentPosition!.lng,
      pickupLat,
      pickupLng,
    ),
  }))

  // 4 — max distanza (per normalizzazione)
  const maxDist = Math.max(...withDistance.map((c) => c.distanceKm))

  // 5+6 — ETA + score ponderato
  const scored = withDistance.map((c) => ({
    driver: c.driver,
    vehicle: c.vehicle,
    distanceKm: Math.round(c.distanceKm * 100) / 100,
    etaMinutes: etaMinutes(c.distanceKm),
    score: weightedScore(c.distanceKm, maxDist, c.driver.rating),
    isNearest: false,
  }))

  // 7 — ordinamento per score crescente
  scored.sort((a, b) => a.score - b.score)

  // marca il vincitore
  if (scored.length > 0) scored[0].isNearest = true

  return scored
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOCODING — converte indirizzo testuale → coordinate GPS
// Usa Nominatim/OpenStreetMap (gratuito, no API key)
// Aggiunge ", Italy" per migliorare l'accuratezza sugli indirizzi italiani
// ─────────────────────────────────────────────────────────────────────────────
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null
  try {
    const query = encodeURIComponent(`${address}, Italy`)
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=it`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'it', 'User-Agent': 'NCC-Gestionale-B2B/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
