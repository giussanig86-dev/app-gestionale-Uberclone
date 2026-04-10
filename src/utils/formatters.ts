import { format, parseISO, formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
}

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: it })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: it })
  } catch {
    return date
  }
}

export function formatTimeAgo(date: string): string {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: it })
  } catch {
    return date
  }
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
