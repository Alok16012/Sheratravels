import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import DayBuilder from '../components/DayBuilder'
import PreviewModal from '../components/PreviewModal'
import InfoTab from '../components/tabs/InfoTab'
import PhotosTab from '../components/tabs/PhotosTab'
import PricingTab from '../components/tabs/PricingTab'
import TCTab from '../components/tabs/TCTab'

const MOBILE_NAV = [
  { id: 'info',    label: 'Info',    icon: '📋' },
  { id: 'photos',  label: 'Photos',  icon: '🖼' },
  { id: 'days',    label: 'Days',    icon: '📅' },
  { id: 'pricing', label: 'Price',   icon: '💰' },
  { id: 'tc',      label: 'T&C',     icon: '📄' },
]

const SIDEBAR_TAB_MAP = { info: 'info', photos: 'photos', pricing: 'pricing', tc: 'tc' }

export default function Editor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    currentPackage: pkg, prices, days, loading,
    loadPackage, fetchLibrary, saveAll,
  } = usePackage()

  const [sidebarTab, setSidebarTab] = useState('info')
  const [mobileTab, setMobileTab] = useState('days')
  const [previewOpen, setPreviewOpen] = useState(false)
  const saveRef = useRef(null)

  useEffect(() => {
    if (id) {
      loadPackage(id)
      fetchLibrary()
    }
  }, [id]) // eslint-disable-line

  // Auto-save debounced
  useEffect(() => {
    if (!pkg?.id) return
    clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => saveAll(pkg, prices, days), 1200)
    return () => clearTimeout(saveRef.current)
  }, [pkg, prices, days]) // eslint-disable-line

  const handleMobileTab = (tab) => {
    setMobileTab(tab)
    if (SIDEBAR_TAB_MAP[tab]) setSidebarTab(tab)
  }

  if (loading && !pkg) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading package…</p>
      </div>
    )
  }

  if (!loading && !pkg) {
    return (
      <div className="loading-screen">
        <p style={{ fontSize: 16, color: '#fff' }}>Package not found.</p>
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    )
  }

  // Mobile content panel by tab
  const MobilePanel = () => {
    const map = { info: InfoTab, photos: PhotosTab, pricing: PricingTab, tc: TCTab }
    const Tab = map[mobileTab]
    if (!Tab) return null
    return (
      <div className="editor-main" style={{ paddingBottom: 80, paddingTop: 24, minHeight: '100vh' }}>
        <Tab active />
      </div>
    )
  }

  return (
    <>
      <Topbar
        mode="editor"
        packageTitle={pkg?.title || ''}
        onPreview={() => setPreviewOpen(true)}
        onPrint={() => { setPreviewOpen(true); setTimeout(() => window.print(), 600) }}
      />

      {/* ──── DESKTOP LAYOUT ──── */}
      <div className="editor-layout desktop-only">
        <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab} />
        <DayBuilder />
      </div>

      {/* ──── MOBILE LAYOUT ──── */}
      <div className="mobile-layout">
        {mobileTab === 'days' ? <DayBuilder /> : <MobilePanel />}
      </div>

      {/* ──── MOBILE BOTTOM NAV ──── */}
      <nav className="mobile-bottom-nav">
        {MOBILE_NAV.map(t => (
          <button
            key={t.id}
            className={`mobile-nav-item ${mobileTab === t.id ? 'active' : ''}`}
            onClick={() => handleMobileTab(t.id)}
          >
            <span className="mobile-nav-item-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ──── PREVIEW MODAL ──── */}
      {previewOpen && (
        <PreviewModal
          open
          pkg={pkg}
          prices={prices}
          days={days}
          onClose={() => setPreviewOpen(false)}
          onPrint={() => window.print()}
        />
      )}
    </>
  )
}
