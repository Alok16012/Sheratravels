import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import DayBuilder from '../components/DayBuilder'
import PreviewModal from '../components/PreviewModal'
import InfoTab from '../components/tabs/InfoTab'
import PhotosTab from '../components/tabs/PhotosTab'
import PricingTab from '../components/tabs/PricingTab'
import TCTab from '../components/tabs/TCTab'
import LocationsTab from '../components/tabs/LocationsTab'
import toast from 'react-hot-toast'

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    currentPackage: pkg, prices, days, loading, saveStatus,
    loadPackage, fetchLibrary, saveAll,
  } = usePackage()

  const [activeTab, setActiveTab] = useState('info')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tabsSheetOpen, setTabsSheetOpen] = useState(false)
  const saveRef = useRef(null)

  useEffect(() => {
    if (id) {
      loadPackage(id)
      fetchLibrary()
    }
  }, [id])

  useEffect(() => {
    if (!pkg?.id) return
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => saveAll(pkg, prices, days), 1500)
    return () => clearTimeout(saveRef.current)
  }, [pkg, prices, days])

  if (loading && !pkg) {
    return <div className="loading-state"><div className="spinner" /></div>
  }

  if (!loading && !pkg) {
    return (
      <div className="empty-state">
        <h2>Package not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    )
  }

  const handlePrint = () => {
    setPreviewOpen(true)
    const originalTitle = document.title
    document.title = pkg?.title || 'Itinerary'
    setTimeout(() => {
      window.print()
      // Restore title after print dialog closes
      setTimeout(() => { document.title = originalTitle }, 1000)
    }, 500)
  }

  const tabs = [
    { id: 'info',      label: 'Basics',     icon: '📝' },
    { id: 'photos',    label: 'Media',      icon: '🖼️' },
    { id: 'pricing',   label: 'Rates',      icon: '💰' },
    { id: 'tc',        label: 'T&C',        icon: '📄' },
    { id: 'locations', label: 'Locations',  icon: '📍' },
  ]

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/leads', label: 'Leads', icon: '👥' },
    { path: '/bookings', label: 'Bookings', icon: '📅' },
    { path: '/admin', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="editor-layout">
      <div className={`editor-sidebar-overlay ${sidebarOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <aside className={`editor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <NavLink to="/" className="brand" onClick={() => setSidebarOpen(false)}>
          <div className="brand-logo">ST</div>
          <span className="brand-name">Shera Travels</span>
        </NavLink>

        <nav className="nav-links">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-footer">
          <button onClick={() => { localStorage.removeItem('shara_auth'); navigate('/login') }} className="logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="editor-canvas">
        <div className="editor-top-bar glass-card animate-fade">
          <div className="top-bar-left">
            <button className="icon-btn back-btn mobile-show" onClick={() => setSidebarOpen(true)}>☰</button>
            <button className="icon-btn back-btn mobile-hide" onClick={() => navigate('/')}>←</button>
            <div className="pkg-info">
              <h3 className="text-gradient">{pkg.title || 'Untitled Package'}</h3>
              <div className={`save-status ${saveStatus}`}>
                {saveStatus === 'saving' ? 'Saving changes...' : 'All changes saved'}
              </div>
            </div>
          </div>

          <div className="top-bar-actions">
            <button className="btn btn-ghost" onClick={() => setPreviewOpen(true)}>
              <span>👁️</span> Preview
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <span>🖨️</span> Export PDF
            </button>
          </div>
        </div>

        <div className="editor-workspace">
          <div className="editor-main-content">
            <div className="glass-card builder-container">
              <DayBuilder />
            </div>
          </div>

          <div className={`mobile-tabs-backdrop ${tabsSheetOpen ? 'active' : ''}`} onClick={() => setTabsSheetOpen(false)} />
          <aside className={`editor-sidebar-tabs glass-card ${tabsSheetOpen ? 'mobile-open' : ''}`}>
            <div className="tabs-header">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`sidebar-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(t.id)
                    setTabsSheetOpen(true)
                  }}
                >
                  <span className="icon">{t.icon}</span>
                  <span className="label">{t.label}</span>
                </button>
              ))}
              <button
                className="sidebar-tab mobile-show mobile-sheet-toggle"
                onClick={() => setTabsSheetOpen(o => !o)}
                aria-label="Toggle details panel"
              >
                <span className="icon">{tabsSheetOpen ? '▾' : '▴'}</span>
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === 'info'      && <InfoTab active />}
              {activeTab === 'photos'    && <PhotosTab active />}
              {activeTab === 'pricing'   && <PricingTab active />}
              {activeTab === 'tc'        && <TCTab active />}
              {activeTab === 'locations' && <LocationsTab active />}
            </div>
          </aside>
        </div>
      </div>

      {previewOpen && (
        <PreviewModal open pkg={pkg} prices={prices} days={days}
          onClose={() => setPreviewOpen(false)}
          onPrint={handlePrint}
        />
      )}
    </div>
  )
}
