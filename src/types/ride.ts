export type RideStatus =
  | 'bozza'
  | 'confermata'
  | 'assegnata'
  | 'in_corso'
  | 'completata'
  | 'annullata'
  | 'no_show'

export type ServiceType = 'ncc' | 'taxi' | 'transfer_aeroporto' | 'transfer_fiera'

export interface RideWaypoint {
  label: string
  lat: number
  lng: number
  isAirport?: boolean
  flightNumber?: string
}

export interface Ride {
  id: string
  companyId: string
  costCenterId: string
  serviceType: ServiceType
  status: RideStatus
  passengerId: string
  passengerName: string
  passengerPhone: string
  driverId: string | null
  vehicleId: string | null
  origin: RideWaypoint
  destination: RideWaypoint
  stops: RideWaypoint[]
  scheduledAt: string
  startedAt: string | null
  completedAt: string | null
  estimatedDuration: number
  actualDuration: number | null
  estimatedDistance: number
  actualDistance: number | null
  estimatedPrice: number
  finalPrice: number | null
  co2Grams: number | null
  invoiceId: string | null
  notes: string
  internalRef: string
  createdBy: string
  createdAt: string
}
