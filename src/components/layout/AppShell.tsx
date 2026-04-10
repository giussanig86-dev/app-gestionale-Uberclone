import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/prenotazione': 'Prenotazioni',
  '/prenotazione/nuova': 'Nuova Prenotazione',
  '/flotta': 'Gestione Flotta',
  '/tracking': 'Tracking in Tempo Reale',
  '/fatturazione': 'Fatturazione B2B',
  '/carbon': 'Carbon Footprint',
  '/compliance': 'Compliance Documenti',
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/prenotazione/')) return 'Dettaglio Prenotazione'
  if (pathname.startsWith('/flotta/veicoli/')) return 'Dettaglio Veicolo'
  if (pathname.startsWith('/flotta/autisti/')) return 'Dettaglio Autista'
  if (pathname.startsWith('/fatturazione/')) return 'Dettaglio Fattura'
  if (pathname.startsWith('/compliance/autisti/')) return 'Documenti Autista'
  if (pathname.startsWith('/tracking/')) return 'Tracking Corsa'
  return 'Gestionale NCC & Taxi'
}

export default function AppShell() {
  const location = useLocation()
  const title = getTitle(location.pathname)
  const isFullscreen = location.pathname.startsWith('/tracking')

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={title} />
        <main className={isFullscreen ? 'flex-1 overflow-hidden' : 'flex-1 overflow-y-auto p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
