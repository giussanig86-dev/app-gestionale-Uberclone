import type { ComplianceDoc } from '@/types'
import { DOC_ALERT_DAYS } from '@/types'

const today = new Date()
const exp = (daysFromNow: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

export const mockComplianceDocs: ComplianceDoc[] = [
  // Driver 001 - Antonio Mancini
  { id: 'doc-001', driverId: 'drv-001', companyId: 'comp-001', docType: 'patente_guida', docNumber: 'MI2345678A', issuedBy: 'MCTC Milano', issueDate: '2017-06-15', expiryDate: exp(540), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.patente_guida, notes: '', lastVerifiedAt: '2025-01-10', uploadedBy: 'emp-001' },
  { id: 'doc-002', driverId: 'drv-001', companyId: 'comp-001', docType: 'autorizzazione_ncc', docNumber: 'NCC-MI-00123', issuedBy: 'Comune di Milano', issueDate: '2023-03-20', expiryDate: exp(25), status: 'in_scadenza', alertDaysBefore: DOC_ALERT_DAYS.autorizzazione_ncc, notes: 'In rinnovo presso SUAP', lastVerifiedAt: '2025-01-15', uploadedBy: 'emp-001' },
  { id: 'doc-003', driverId: 'drv-001', companyId: 'comp-001', docType: 'idoneita_psicofisica', docNumber: 'IPF-MI-2024-001', issuedBy: 'ASL Milano', issueDate: '2024-01-10', expiryDate: exp(275), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.idoneita_psicofisica, notes: '', lastVerifiedAt: '2024-01-10', uploadedBy: 'emp-001' },
  { id: 'doc-004', driverId: 'drv-001', companyId: 'comp-001', docType: 'corso_formazione_ncc', docNumber: 'FORM-2023-MI-456', issuedBy: 'Autoscuola Centrale', issueDate: '2023-06-01', expiryDate: exp(-10), status: 'scaduto', alertDaysBefore: DOC_ALERT_DAYS.corso_formazione_ncc, notes: 'DA RINNOVARE URGENTE', lastVerifiedAt: '2024-06-01', uploadedBy: 'emp-001' },
  { id: 'doc-005', driverId: 'drv-001', companyId: 'comp-001', docType: 'certificato_penale', docNumber: 'CP-2024-001', issuedBy: 'Tribunale di Milano', issueDate: '2024-02-15', expiryDate: exp(310), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.certificato_penale, notes: '', lastVerifiedAt: '2024-02-15', uploadedBy: 'emp-001' },

  // Driver 002 - Giuseppe Ricci
  { id: 'doc-006', driverId: 'drv-002', companyId: 'comp-001', docType: 'patente_guida', docNumber: 'MI3456789B', issuedBy: 'MCTC Milano', issueDate: '2016-09-20', expiryDate: exp(420), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.patente_guida, notes: '', lastVerifiedAt: '2025-01-08', uploadedBy: 'emp-001' },
  { id: 'doc-007', driverId: 'drv-002', companyId: 'comp-001', docType: 'autorizzazione_ncc', docNumber: 'NCC-MI-00456', issuedBy: 'Comune di Milano', issueDate: '2024-01-15', expiryDate: exp(180), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.autorizzazione_ncc, notes: '', lastVerifiedAt: '2024-01-15', uploadedBy: 'emp-001' },
  { id: 'doc-008', driverId: 'drv-002', companyId: 'comp-001', docType: 'idoneita_psicofisica', docNumber: 'IPF-MI-2023-002', issuedBy: 'ASL Milano', issueDate: '2023-05-20', expiryDate: exp(40), status: 'in_scadenza', alertDaysBefore: DOC_ALERT_DAYS.idoneita_psicofisica, notes: 'Visita prenotata per il 15/02', lastVerifiedAt: '2023-05-20', uploadedBy: 'emp-001' },
  { id: 'doc-009', driverId: 'drv-002', companyId: 'comp-001', docType: 'corso_formazione_ncc', docNumber: 'FORM-2024-MI-102', issuedBy: 'CAF Lombardia', issueDate: '2024-03-10', expiryDate: exp(420), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.corso_formazione_ncc, notes: '', lastVerifiedAt: '2024-03-10', uploadedBy: 'emp-001' },
  { id: 'doc-010', driverId: 'drv-002', companyId: 'comp-001', docType: 'certificato_penale', docNumber: 'CP-2023-002', issuedBy: 'Tribunale di Milano', issueDate: '2023-11-01', expiryDate: exp(210), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.certificato_penale, notes: '', lastVerifiedAt: '2023-11-01', uploadedBy: 'emp-001' },

  // Driver 003 - Carmine Esposito
  { id: 'doc-011', driverId: 'drv-003', companyId: 'comp-001', docType: 'patente_guida', docNumber: 'MI4567890C', issuedBy: 'MCTC Milano', issueDate: '2002-03-10', expiryDate: exp(-5), status: 'scaduto', alertDaysBefore: DOC_ALERT_DAYS.patente_guida, notes: 'URGENTE: Rinnovo patente scaduta!', lastVerifiedAt: '2024-12-01', uploadedBy: 'emp-001' },
  { id: 'doc-012', driverId: 'drv-003', companyId: 'comp-001', docType: 'autorizzazione_ncc', docNumber: 'NCC-MI-00789', issuedBy: 'Comune di Milano', issueDate: '2024-06-01', expiryDate: exp(340), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.autorizzazione_ncc, notes: '', lastVerifiedAt: '2024-06-01', uploadedBy: 'emp-001' },
  { id: 'doc-013', driverId: 'drv-003', companyId: 'comp-001', docType: 'idoneita_psicofisica', docNumber: 'IPF-MI-2024-003', issuedBy: 'ASL Milano', issueDate: '2024-04-15', expiryDate: exp(370), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.idoneita_psicofisica, notes: '', lastVerifiedAt: '2024-04-15', uploadedBy: 'emp-001' },
  { id: 'doc-014', driverId: 'drv-003', companyId: 'comp-001', docType: 'corso_formazione_ncc', docNumber: 'FORM-2022-MI-789', issuedBy: 'Autoscuola Roma', issueDate: '2022-09-01', expiryDate: exp(50), status: 'in_scadenza', alertDaysBefore: DOC_ALERT_DAYS.corso_formazione_ncc, notes: '', lastVerifiedAt: '2022-09-01', uploadedBy: 'emp-001' },

  // Company DURC & Visura
  { id: 'doc-020', companyId: 'comp-001', docType: 'durc', docNumber: 'DURC-2024-001234', issuedBy: 'INPS', issueDate: '2024-10-01', expiryDate: exp(75), status: 'in_scadenza', alertDaysBefore: DOC_ALERT_DAYS.durc, notes: 'Scadenza trimestrale — richiesto rinnovo', lastVerifiedAt: '2024-10-01', uploadedBy: 'emp-001' },
  { id: 'doc-021', companyId: 'comp-001', docType: 'visura_camerale', docNumber: 'REA-MI-1234567', issuedBy: 'CCIAA Milano', issueDate: '2024-01-15', expiryDate: exp(280), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.visura_camerale, notes: '', lastVerifiedAt: '2024-01-15', uploadedBy: 'emp-001' },

  // Vehicle docs
  { id: 'doc-030', vehicleId: 'veh-001', companyId: 'comp-001', docType: 'assicurazione_rc', docNumber: 'INS-2024-001', issuedBy: 'Generali Assicurazioni', issueDate: '2024-07-01', expiryDate: exp(81), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.assicurazione_rc, notes: '', lastVerifiedAt: '2024-07-01', uploadedBy: 'emp-001' },
  { id: 'doc-031', vehicleId: 'veh-001', companyId: 'comp-001', docType: 'revisione', docNumber: 'REV-2024-EF123GH', issuedBy: 'Centro Revisioni Milano', issueDate: '2024-11-15', expiryDate: exp(279), status: 'valido', alertDaysBefore: DOC_ALERT_DAYS.revisione, notes: '', lastVerifiedAt: '2024-11-15', uploadedBy: 'emp-001' },
  { id: 'doc-032', vehicleId: 'veh-004', companyId: 'comp-001', docType: 'assicurazione_rc', docNumber: 'INS-2024-004', issuedBy: 'UnipolSai', issueDate: '2024-04-20', expiryDate: exp(10), status: 'in_scadenza', alertDaysBefore: DOC_ALERT_DAYS.assicurazione_rc, notes: 'RINNOVO URGENTE', lastVerifiedAt: '2024-04-20', uploadedBy: 'emp-001' },
  { id: 'doc-033', vehicleId: 'veh-004', companyId: 'comp-001', docType: 'nccPlateAuthExpiry' as 'autorizzazione_ncc', docNumber: 'NCC-TARGA-KL012MN', issuedBy: 'Comune di Milano', issueDate: '2023-05-10', expiryDate: exp(30), status: 'in_scadenza', alertDaysBefore: 60, notes: '', lastVerifiedAt: '2023-05-10', uploadedBy: 'emp-001' },
]
