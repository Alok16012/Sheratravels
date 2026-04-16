import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import DayBuilder from '../components/DayBuilder'
import PreviewModal from '../components/PreviewModal'
import InfoTab from '../components/tabs/InfoTab'
import PhotosTab from '../components/tabs/PhotosTab'
import PricingTab from '../components/tabs/PricingTab'
import TCTab from '../components/tabs/TCTab'
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
  const saveRef = useRef(null)

  useEffect(() => {
    if (id) {
      loadPackage(id)
      fetchLibrary()
    }
  }, [id])

  // Auto-save debounced
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

  const tabs = [
    { id: 'info', label: 'Basics', icon: '📝' },
    { id: 'photos', label: 'Media', icon: '🖼️' },
    { id: 'pricing', label: 'Rates', icon: '💰' },
    { id: 'tc', label: 'T&C', icon: '📄' },
  ]

  return (
    <div className="editor-canvas">
      {/* Editor Floating Top Bar */}
      <div className="editor-top-bar glass-card animate-fade">
        <div className="top-bar-left">
          <button className="icon-btn back-btn" onClick={() => navigate('/')}>←</button>
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
          <button className="btn btn-primary" onClick={() => {
            setPreviewOpen(true)
            setTimeout(() => window.print(), 800)
          }}>
            <span>🖨️</span> Export PDF
          </button>
        </div>
      </div>

      <div className="editor-workspace animate-fade" style={{ animationDelay: '0.2s' }}>
        {/* Left Col: Main Builder */}
        <div className="editor-main-content">
          <div className="glass-card builder-container">
            <DayBuilder />
          </div>
        </div>

        {/* Right Col: Settings & Media */}
        <aside className="editor-sidebar-tabs glass-card">
          <div className="tabs-header">
            {tabs.map(t => (
              <button 
                key={t.id} 
                className={`sidebar-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <span className="icon">{t.icon}</span>
                <span className="label">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="tabs-content">
            {activeTab === 'info' && <InfoTab active />}
            {activeTab === 'photos' && <PhotosTab active />}
            {activeTab === 'pricing' && <PricingTab active />}
            {activeTab === 'tc' && <TCTab active />}
          </div>
        </aside>
      </div>

      {previewOpen && (
        <PreviewModal open pkg={pkg} prices={prices} days={days} 
          onClose={() => setPreviewOpen(false)} 
        />
      )}

    </div>
  )
}
