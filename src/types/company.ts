export interface CostCenter {
  id: string
  companyId: string
  code: string
  name: string
  budget: number | null
  spent: number
  managerId: string
}

export type UserRole =
  | 'autista'
  | 'gestore_flotta'
  | 'azienda'
  | 'dipendente'
  | 'supervisore_it'
  | 'customer_service'

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  autista: 'Autista',
  gestore_flotta: 'Gestore Flotta',
  azienda: 'Amministratore Azienda',
  dipendente: 'Dipendente',
  supervisore_it: 'Supervisore IT',
  customer_service: 'Customer Service',
}

export interface CompanyEmployee {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  costCenterId: string
  role: UserRole
  isActive: boolean
  driverId?: string   // solo per ruolo 'autista'
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
