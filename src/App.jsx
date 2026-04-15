import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

// Public pages (no auth)
import BookingForm from './pages/BookingForm'

// Styles
import './styles/index.css'
import './styles/crm.css'

export default function App() {
  return (
    <BrowserRouter>
      <PackageProvider>
        <CRMProvider>
          <BookingProvider>
            <Routes>
              {/* ── Itinerary Maker ── */}
              <Route path="/"           element={<Home />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/admin"      element={<Admin />} />

              {/* ── CRM ── */}
              <Route path="/crm"                  element={<Dashboard />} />
              <Route path="/crm/leads"            element={<Leads />} />
              <Route path="/crm/bookings"         element={<Bookings />} />
              <Route path="/crm/bookings/:id"     element={<BookingDetail />} />

              {/* ── Public (customer-facing) ── */}
              <Route path="/booking/form/:token"  element={<BookingForm />} />
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
