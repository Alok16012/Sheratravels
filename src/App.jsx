import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { PackageProvider } from './context/PackageContext'
import { CRMProvider }     from './context/CRMContext'
import { BookingProvider } from './context/BookingContext'

// Each page is its own lazy chunk so the browser only downloads the code
// for the page the user actually opens, instead of one giant bundle upfront.

// Itinerary Maker pages
const Home    = lazy(() => import('./pages/Home'))
const Editor  = lazy(() => import('./pages/Editor'))
const Admin   = lazy(() => import('./pages/Admin'))

// CRM pages
const Dashboard     = lazy(() => import('./pages/crm/Dashboard'))
const Leads         = lazy(() => import('./pages/crm/Leads'))
const Bookings      = lazy(() => import('./pages/crm/Bookings'))
const BookingDetail = lazy(() => import('./pages/crm/BookingDetail'))

// Itinerary listing
const Itinerary = lazy(() => import('./pages/Itinerary'))

// Resources & Admin (placeholders)
const Invoices  = lazy(() => import('./pages/Invoices'))
const Hotels    = lazy(() => import('./pages/Hotels'))
const Cabs      = lazy(() => import('./pages/Cabs'))
const Photos    = lazy(() => import('./pages/Photos'))
const Income    = lazy(() => import('./pages/Income'))
const Expenses  = lazy(() => import('./pages/Expenses'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))

// Auth & Public
const Login       = lazy(() => import('./pages/Login'))
const BookingForm = lazy(() => import('./pages/BookingForm'))

// Layout
import MainLayout from './components/MainLayout'

function PageFallback() {
  return <div className="loading-state"><div className="spinner" /></div>
}

// Styles
import './styles/index.css'

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('shara_auth') === 'true'
  return isAuth ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" replace />
}

const StandaloneRoute = ({ children }) => {
  const isAuth = localStorage.getItem('shara_auth') === 'true'
  return isAuth ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <PackageProvider>
        <CRMProvider>
          <BookingProvider>
            <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* ── Public ── */}
              <Route path="/login" element={<Login />} />
              <Route path="/booking/form/:token" element={<BookingForm />} />

              {/* ── Protected Dashboard ── */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>} />
              <Route path="/editor/:id" element={<StandaloneRoute><Editor /></StandaloneRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

              <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />

              {/* ── Operations / Resources / Admin ── */}
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/hotels" element={<ProtectedRoute><Hotels /></ProtectedRoute>} />
              <Route path="/cabs" element={<ProtectedRoute><Cabs /></ProtectedRoute>} />
              <Route path="/photos" element={<ProtectedRoute><Photos /></ProtectedRoute>} />
              <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
            </Routes>
            </Suspense>

            <Toaster
              position="bottom-center"
              toastOptions={{
                style: {
                  borderRadius: '10px',
                  background: '#1a1a1a',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </BookingProvider>
        </CRMProvider>
      </PackageProvider>
    </BrowserRouter>
  )
}
