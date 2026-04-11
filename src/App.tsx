import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useAuth } from '@/store/AppContext'
import type { UserRole } from '@/types'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/Auth/Login'
import DashboardPage from '@/pages/Dashboard'
import PrenotazionePage from '@/pages/Prenotazione'
import BookingWizard from '@/pages/Prenotazione/BookingWizard'
import BookingDetail from '@/pages/Prenotazione/BookingDetail'
import FlottaPage from '@/pages/Flotta'
import VehicleDetail from '@/pages/Flotta/VehicleDetail'
import DriverDetail from '@/pages/Flotta/DriverDetail'
import FatturazionePage from '@/pages/Fatturazione'
import InvoiceDetail from '@/pages/Fatturazione/InvoiceDetail'
import TrackingPage from '@/pages/Tracking'
import CarbonPage from '@/pages/CarbonFootprint'
import CompliancePage from '@/pages/Compliance'
import DriverDocsPage from '@/pages/Compliance/DriverDocsList'
import UtentiPage from '@/pages/Utenti'
import ToastContainer from '@/components/ui/ToastContainer'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { role } = useAuth()
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />

          {/* Prenotazioni — tutti i ruoli, filtro dati dentro la pagina */}
          <Route path="prenotazione" element={<PrenotazionePage />} />
          <Route path="prenotazione/:id" element={<BookingDetail />} />
          <Route path="prenotazione/nuova" element={
            <RoleGuard roles={['gestore_flotta', 'azienda', 'dipendente', 'supervisore_it']}>
              <BookingWizard />
            </RoleGuard>
          } />

          {/* Flotta */}
          <Route path="flotta" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it']}>
              <FlottaPage />
            </RoleGuard>
          } />
          <Route path="flotta/veicoli/:id" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it']}>
              <VehicleDetail />
            </RoleGuard>
          } />
          <Route path="flotta/autisti/:id" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it']}>
              <DriverDetail />
            </RoleGuard>
          } />

          {/* Fatturazione */}
          <Route path="fatturazione" element={
            <RoleGuard roles={['gestore_flotta', 'azienda', 'supervisore_it']}>
              <FatturazionePage />
            </RoleGuard>
          } />
          <Route path="fatturazione/:id" element={
            <RoleGuard roles={['gestore_flotta', 'azienda', 'supervisore_it']}>
              <InvoiceDetail />
            </RoleGuard>
          } />

          {/* Tracking */}
          <Route path="tracking" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it', 'customer_service']}>
              <TrackingPage />
            </RoleGuard>
          } />
          <Route path="tracking/:rideId" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it', 'customer_service']}>
              <TrackingPage />
            </RoleGuard>
          } />

          {/* Carbon */}
          <Route path="carbon" element={
            <RoleGuard roles={['gestore_flotta', 'azienda', 'supervisore_it']}>
              <CarbonPage />
            </RoleGuard>
          } />

          {/* Compliance */}
          <Route path="compliance" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it']}>
              <CompliancePage />
            </RoleGuard>
          } />
          <Route path="compliance/autisti/:driverId" element={
            <RoleGuard roles={['gestore_flotta', 'supervisore_it']}>
              <DriverDocsPage />
            </RoleGuard>
          } />

          {/* Gestione Utenti — solo supervisore IT */}
          <Route path="utenti" element={
            <RoleGuard roles={['supervisore_it']}>
              <UtentiPage />
            </RoleGuard>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
