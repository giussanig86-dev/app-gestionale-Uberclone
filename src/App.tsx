import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useAuth } from '@/store/AppContext'
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
import ToastContainer from '@/components/ui/ToastContainer'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
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
          <Route path="prenotazione" element={<PrenotazionePage />} />
          <Route path="prenotazione/nuova" element={<BookingWizard />} />
          <Route path="prenotazione/:id" element={<BookingDetail />} />
          <Route path="flotta" element={<FlottaPage />} />
          <Route path="flotta/veicoli/:id" element={<VehicleDetail />} />
          <Route path="flotta/autisti/:id" element={<DriverDetail />} />
          <Route path="fatturazione" element={<FatturazionePage />} />
          <Route path="fatturazione/:id" element={<InvoiceDetail />} />
          <Route path="tracking" element={<TrackingPage />} />
          <Route path="tracking/:rideId" element={<TrackingPage />} />
          <Route path="carbon" element={<CarbonPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="compliance/autisti/:driverId" element={<DriverDocsPage />} />
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
