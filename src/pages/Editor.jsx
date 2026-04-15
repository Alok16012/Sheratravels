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

      <style jsx>{`
        .editor-canvas {
          padding: 32px;
          padding-top: 100px;
          min-height: 100vh;
        }

        .editor-top-bar {
          position: fixed;
          top: 24px;
          left: calc(var(--sidebar-w) + 32px);
          right: 32px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
        }

        .top-bar-left { display: flex; align-items: center; gap: 20px; }
        .pkg-info h3 { font-size: 18px; font-weight: 800; margin-bottom: 2px; }
        .save-status { font-size: 11px; font-weight: 700; color: var(--text-dim); }
        .save-status.saved { color: #10b981; }
        .save-status.saving { color: var(--primary); }

        .top-bar-actions { display: flex; gap: 12px; }

        .editor-workspace {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @media (max-width: 1200px) {
          .editor-workspace { grid-template-columns: 1fr; }
          .editor-sidebar-tabs { position: static; height: auto; }
        }

        .builder-container { padding: 0; min-height: 600px; }

        .editor-sidebar-tabs {
          height: calc(100vh - 160px);
          position: sticky;
          top: 126px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.02);
        }

        .sidebar-tab {
          flex: 1;
          padding: 16px 8px;
          border: none;
          background: none;
          color: var(--text-dim);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: var(--transition);
        }

        .sidebar-tab:hover { color: var(--text-bright); }
        .sidebar-tab.active {
          color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
          box-shadow: inset 0 -2px 0 var(--primary);
        }

        .tabs-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.05);
          color: #fff;
          cursor: pointer;
          transition: var(--transition);
        }

        .icon-btn:hover { background: rgba(255,255,255,0.1); transform: scale(1.1); }
      `}</style>
    </div>
  )
}
