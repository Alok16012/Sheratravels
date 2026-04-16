import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { PackageProvider } from './context/PackageContext'
import { CRMProvider }     from './context/CRMContext'
import { BookingProvider } from './context/BookingContext'

// Itinerary Maker pages
import Home    from './pages/Home'
import Editor  from './pages/Editor'
import Admin   from './pages/Admin'

// CRM pages
import Dashboard    from './pages/crm/Dashboard'
import Leads        from './pages/crm/Leads'
import Bookings     from './pages/crm/Bookings'
import BookingDetail from './pages/crm/BookingDetail'

// Auth & Public
import Login       from './pages/Login'
import BookingForm from './pages/BookingForm'

// Layout
import MainLayout from './components/MainLayout'

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
            <Routes>
              {/* ── Public ── */}
              <Route path="/login" element={<Login />} />
              <Route path="/booking/form/:token" element={<BookingForm />} />

              {/* ── Protected Dashboard ── */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/editor/:id" element={<StandaloneRoute><Editor /></StandaloneRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              
              <Route path="/crm/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
              <Route path="/crm/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
              <Route path="/crm/bookings/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
              
              {/* Redirect /crm to home dashboard */}
              <Route path="/crm" element={<Navigate to="/" replace />} />
            </Routes>

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
