export interface CostCenter {
  id: string
  companyId: string
  code: string
  name: string
  budget: number | null
  spent: number
  managerId: string
}

export interface CompanyEmployee {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  costCenterId: string
  role: 'admin' | 'booking_manager' | 'traveler'
  isActive: boolean
}

export interface Company {
  id: string
  ragioneSociale: string
  partitaIva: string
  codiceFiscale: string
  pec: string
  sdiCode: string
  address: string
  city: string
  cap: string
  province: string
  contactName: string
  contactEmail: string
  contactPhone: string
  contractType: 'mensile' | 'annuale' | 'prepagato'
  creditLimit: number
  currentBalance: number
  costCenters: CostCenter[]
  employees: CompanyEmployee[]
  logoUrl?: string
  createdAt: string
}
