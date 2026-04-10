export type DriverStatus = 'disponibile' | 'in_corsa' | 'offline' | 'pausa'
export type LicenseCategory = 'B' | 'D' | 'D1' | 'DE'

export interface GeoPosition {
  lat: number
  lng: number
  heading?: number
  speed?: number
  timestamp: string
}

export interface Driver {
  id: string
  firstName: string
  lastName: string
  fiscalCode: string
  phone: string
  email: string
  status: DriverStatus
  licenseNumber: string
  licenseCategory: LicenseCategory
  licenseExpiry: string
  nccAuthorizationNumber: string
  taxiLicenseNumber?: string
  companyId: string
  vehicleId: string | null
  currentPosition: GeoPosition | null
  rating: number
  totalRides: number
  joinedAt: string
  photoUrl?: string
}
