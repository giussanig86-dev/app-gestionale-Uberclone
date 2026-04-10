import clsx from 'clsx'
import type { RideStatus, DriverStatus, VehicleStatus, DocStatus } from '@/types'

type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md'
  dot?: boolean
}

const colorClasses: Record<BadgeColor, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
}

const dotColors: Record<BadgeColor, string> = {
  green: 'bg-emerald-500',
  blue: 'bg-blue-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
}

export default function Badge({ children, color = 'gray', size = 'md', dot }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      colorClasses[color],
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1',
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[color])} />}
      {children}
    </span>
  )
}

export function RideStatusBadge({ status }: { status: RideStatus }) {
  const map: Record<RideStatus, { label: string; color: BadgeColor }> = {
    bozza: { label: 'Bozza', color: 'gray' },
    confermata: { label: 'Confermata', color: 'blue' },
    assegnata: { label: 'Assegnata', color: 'purple' },
    in_corso: { label: 'In corso', color: 'green' },
    completata: { label: 'Completata', color: 'gray' },
    annullata: { label: 'Annullata', color: 'red' },
    no_show: { label: 'No Show', color: 'orange' },
  }
  const { label, color } = map[status]
  return <Badge color={color} dot>{label}</Badge>
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const map: Record<DriverStatus, { label: string; color: BadgeColor }> = {
    disponibile: { label: 'Disponibile', color: 'green' },
    in_corsa: { label: 'In corsa', color: 'blue' },
    offline: { label: 'Offline', color: 'gray' },
    pausa: { label: 'Pausa', color: 'yellow' },
  }
  const { label, color } = map[status]
  return <Badge color={color} dot>{label}</Badge>
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const map: Record<VehicleStatus, { label: string; color: BadgeColor }> = {
    disponibile: { label: 'Disponibile', color: 'green' },
    in_servizio: { label: 'In servizio', color: 'blue' },
    manutenzione: { label: 'Manutenzione', color: 'yellow' },
    fuori_servizio: { label: 'Fuori servizio', color: 'red' },
  }
  const { label, color } = map[status]
  return <Badge color={color} dot>{label}</Badge>
}

export function DocStatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, { label: string; color: BadgeColor }> = {
    valido: { label: 'Valido', color: 'green' },
    in_scadenza: { label: 'In scadenza', color: 'yellow' },
    scaduto: { label: 'Scaduto', color: 'red' },
    mancante: { label: 'Mancante', color: 'gray' },
    in_rinnovo: { label: 'In rinnovo', color: 'blue' },
  }
  const { label, color } = map[status]
  return <Badge color={color} dot>{label}</Badge>
}
