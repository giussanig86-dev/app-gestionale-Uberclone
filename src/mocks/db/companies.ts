import type { Company } from '@/types'

export const mockCompanies: Company[] = [
  {
    id: 'comp-001',
    ragioneSociale: 'Acme Italia S.p.A.',
    partitaIva: '01234567890',
    codiceFiscale: '01234567890',
    pec: 'acme@pec.it',
    sdiCode: 'SUBM70N',
    address: 'Via della Repubblica 15',
    city: 'Milano',
    cap: '20121',
    province: 'MI',
    contactName: 'Marco Rossi',
    contactEmail: 'marco.rossi@acme.it',
    contactPhone: '+39 02 1234567',
    contractType: 'mensile',
    creditLimit: 50000,
    currentBalance: 12450,
    costCenters: [
      { id: 'cc-001', companyId: 'comp-001', code: 'DIR-001', name: 'Direzione Generale', budget: 10000, spent: 3200, managerId: 'emp-001' },
      { id: 'cc-002', companyId: 'comp-001', code: 'MKT-001', name: 'Marketing', budget: 5000, spent: 1800, managerId: 'emp-002' },
      { id: 'cc-003', companyId: 'comp-001', code: 'COMM-001', name: 'Commerciale', budget: 8000, spent: 4100, managerId: 'emp-003' },
      { id: 'cc-004', companyId: 'comp-001', code: 'IT-001', name: 'IT & Digital', budget: 3000, spent: 900, managerId: 'emp-004' },
    ],
    employees: [
      { id: 'emp-001', companyId: 'comp-001', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@acme.it', phone: '+39 333 1111111', costCenterId: 'cc-001', role: 'admin', isActive: true },
      { id: 'emp-002', companyId: 'comp-001', firstName: 'Laura', lastName: 'Bianchi', email: 'laura.bianchi@acme.it', phone: '+39 333 2222222', costCenterId: 'cc-002', role: 'booking_manager', isActive: true },
      { id: 'emp-003', companyId: 'comp-001', firstName: 'Giovanni', lastName: 'Verdi', email: 'g.verdi@acme.it', phone: '+39 333 3333333', costCenterId: 'cc-003', role: 'traveler', isActive: true },
      { id: 'emp-004', companyId: 'comp-001', firstName: 'Stefania', lastName: 'Ferrari', email: 's.ferrari@acme.it', phone: '+39 333 4444444', costCenterId: 'cc-004', role: 'traveler', isActive: true },
      { id: 'emp-005', companyId: 'comp-001', firstName: 'Roberto', lastName: 'Esposito', email: 'r.esposito@acme.it', phone: '+39 333 5555555', costCenterId: 'cc-003', role: 'traveler', isActive: true },
    ],
    createdAt: '2023-01-15T09:00:00Z',
  },
]
