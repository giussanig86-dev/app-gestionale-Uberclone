export type VehicleType = 'berlina' | 'monovolume' | 'suv' | 'minibus' | 'taxi'
export type VehicleStatus = 'disponibile' | 'in_servizio' | 'manutenzione' | 'fuori_servizio'
export type FuelType = 'benzina' | 'diesel' | 'ibrido' | 'elettrico' | 'gpl'

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  type: VehicleType
  fuelType: FuelType
  seats: number
  status: VehicleStatus
  mileage: number
  insuranceExpiry: string
  revisioneExpiry: string
  nccPlateAuthExpiry: string
  co2PerKm: number
  companyId: string
  assignedDriverId: string | null
  lastServiceDate: string
  nextServiceKm: number
  photoUrl?: string
}
