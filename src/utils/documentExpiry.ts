import type { DocStatus } from '@/types'
import { differenceInDays, parseISO } from 'date-fns'

export function daysUntilExpiry(expiryDate: string): number {
  return differenceInDays(parseISO(expiryDate), new Date())
}

export function computeDocStatus(expiryDate: string, alertDaysBefore: number): DocStatus {
  if (!expiryDate) return 'mancante'
  const days = daysUntilExpiry(expiryDate)
  if (days < 0) return 'scaduto'
  if (days <= alertDaysBefore) return 'in_scadenza'
  return 'valido'
}

export function expiryLabel(expiryDate: string): string {
  const days = daysUntilExpiry(expiryDate)
  if (days < 0) return `Scaduto da ${Math.abs(days)} giorni`
  if (days === 0) return 'Scade oggi'
  if (days === 1) return 'Scade domani'
  if (days <= 30) return `Scade tra ${days} giorni`
  return `Scade il ${new Date(expiryDate).toLocaleDateString('it-IT')}`
}
