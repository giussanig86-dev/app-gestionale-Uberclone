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
      // ─── Dipendente azienda cliente (accesso solo proprie corse) ───
      { id: 'emp-001', companyId: 'comp-001', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@acme.it', phone: '+39 333 1111111', costCenterId: 'cc-001', role: 'dipendente', isActive: true },
      { id: 'emp-002', companyId: 'comp-001', firstName: 'Laura', lastName: 'Bianchi', email: 'laura.bianchi@acme.it', phone: '+39 333 2222222', costCenterId: 'cc-002', role: 'dipendente', isActive: true },
      { id: 'emp-003', companyId: 'comp-001', firstName: 'Giovanni', lastName: 'Verdi', email: 'g.verdi@acme.it', phone: '+39 333 3333333', costCenterId: 'cc-003', role: 'dipendente', isActive: true },
      // ─── Amministratore azienda cliente (prenotazioni + fatture azienda) ───
      { id: 'emp-004', companyId: 'comp-001', firstName: 'Chiara', lastName: 'Conti', email: 'cfo.admin@acme.it', phone: '+39 333 4444444', costCenterId: 'cc-001', role: 'azienda', isActive: true },
      // ─── Gestore Flotta NCC — con driverId simula operatore singolo (è anche autista) ───
      { id: 'emp-010', companyId: 'comp-001', firstName: 'Giulia', lastName: 'Bianchi', email: 'giulia.bianchi@ncc.it', phone: '+39 333 1010101', costCenterId: 'cc-001', role: 'gestore_flotta', isActive: true, driverId: 'drv-002' },
      // ─── Autista NCC (solo proprie corse assegnate) ───
      { id: 'emp-011', companyId: 'comp-001', firstName: 'Luca', lastName: 'Ferrari', email: 'luca.ferrari@ncc.it', phone: '+39 333 1111112', costCenterId: 'cc-001', role: 'autista', isActive: true, driverId: 'drv-001' },
      // ─── Supervisore IT (accesso totale + gestione utenti) ───
      { id: 'emp-012', companyId: 'comp-001', firstName: 'Andrea', lastName: 'Mancini', email: 'admin.it@sistema.it', phone: '+39 333 1212121', costCenterId: 'cc-004', role: 'supervisore_it', isActive: true },
      // ─── Customer Service (corse read + chat) ───
      { id: 'emp-013', companyId: 'comp-001', firstName: 'Sara', lastName: 'Romano', email: 'cs.support@ncc.it', phone: '+39 333 1313131', costCenterId: 'cc-001', role: 'customer_service', isActive: true },
    ],
    createdAt: '2023-01-15T09:00:00Z',
  },
]
