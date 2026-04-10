export type DocType =
  | 'durc'
  | 'visura_camerale'
  | 'autorizzazione_ncc'
  | 'licenza_taxi'
  | 'carta_di_circolazione'
  | 'assicurazione_rc'
  | 'revisione'
  | 'patente_guida'
  | 'certificato_penale'
  | 'idoneita_psicofisica'
  | 'corso_formazione_ncc'

export type DocStatus = 'valido' | 'in_scadenza' | 'scaduto' | 'mancante' | 'in_rinnovo'

export interface ComplianceDoc {
  id: string
  driverId?: string
  vehicleId?: string
  companyId: string
  docType: DocType
  docNumber: string
  issuedBy: string
  issueDate: string
  expiryDate: string
  status: DocStatus
  fileUrl?: string
  alertDaysBefore: number
  notes: string
  lastVerifiedAt: string
  uploadedBy: string
}

export interface ComplianceAlertSummary {
  driverId: string
  driverName: string
  expiredCount: number
  expiringSoonCount: number
  missingCount: number
  overallStatus: 'compliant' | 'warning' | 'non_compliant'
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  durc: 'DURC',
  visura_camerale: 'Visura Camerale',
  autorizzazione_ncc: 'Autorizzazione NCC',
  licenza_taxi: 'Licenza Taxi',
  carta_di_circolazione: 'Carta di Circolazione',
  assicurazione_rc: 'Assicurazione RC',
  revisione: 'Revisione',
  patente_guida: 'Patente di Guida',
  certificato_penale: 'Certificato Penale',
  idoneita_psicofisica: 'Idoneità Psicofisica',
  corso_formazione_ncc: 'Corso Formazione NCC',
}

export const DOC_ALERT_DAYS: Record<DocType, number> = {
  durc: 90,
  visura_camerale: 365,
  autorizzazione_ncc: 60,
  licenza_taxi: 60,
  carta_di_circolazione: 30,
  assicurazione_rc: 30,
  revisione: 30,
  patente_guida: 90,
  certificato_penale: 180,
  idoneita_psicofisica: 60,
  corso_formazione_ncc: 90,
}
