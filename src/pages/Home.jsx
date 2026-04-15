import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import Topbar from '../components/Topbar'
import PreviewModal from '../components/PreviewModal'
import { supabase } from '../lib/supabase'

const KASHMIR_IMG = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'

export default function Home() {
  const { packages, fetchPackages, createNewPackage, deletePackage, loading } = usePackage()
  const navigate = useNavigate()
  const [previewPkg, setPreviewPkg] = useState(null)
  const [previewData, setPreviewData] = useState(null)

  useEffect(() => { fetchPackages() }, [fetchPackages])

  const handleNew = async () => {
    const id = await createNewPackage()
    if (id) navigate(`/editor/${id}`)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this package? This cannot be undone.')) return
    const ok = await deletePackage(id)
    if (ok) fetchPackages()
  }

  const handlePreview = async (pkg, e) => {
    e.stopPropagation()
    const [pricesRes, daysRes] = await Promise.all([
      supabase.from('prices').select('*').eq('package_id', pkg.id).order('sort_order'),
      supabase.from('days').select('*, day_photos(*)').eq('package_id', pkg.id).order('sort_order'),
    ])
    setPreviewPkg(pkg)
    setPreviewData({ prices: pricesRes.data || [], days: daysRes.data || [] })
  }

  const startingPrice = (pkg) => {
    // We don't fetch prices on home page for perf; show placeholder
    return null
  }

  return (
    <>
      <Topbar mode="home" />
      <div className="home-page">
        {/* HERO SECTION */}
        <div className="home-hero">
          <div className="home-hero-left">
            <div className="home-hero-badge">✈️ Shera Travels — Itinerary Maker</div>
            <h1>Professional<br /><span>Travel Packages</span></h1>
            <p>Build print-ready Kashmir tour itineraries in minutes. Manage packages, pricing, and day-by-day plans — all in one place.</p>
            <div className="home-hero-actions">
              <button className="btn-hero-primary" onClick={handleNew}>✨ New Itinerary</button>
              <button className="btn-hero-ghost" onClick={() => document.getElementById('packages-list')?.scrollIntoView({ behavior: 'smooth' })}>
                📋 View All
              </button>
            </div>
          </div>
          <div className="home-hero-stats">
            <div className="home-hero-stat">
              <div className="home-hero-stat-val">{packages.length}</div>
              <div className="home-hero-stat-label">Packages</div>
            </div>
            <div className="home-hero-stat">
              <div className="home-hero-stat-val" style={{ color: '#10B981' }}>
                {packages.reduce((s, p) => s + (p.nights || 0), 0)}
              </div>
              <div className="home-hero-stat-label">Total Nights</div>
            </div>
          </div>
        </div>

        {/* PACKAGES SECTION */}
        <div className="home-content" id="packages-list">
          <div className="home-section-header">
            <h2>
              📦 Saved Packages
              <span>({packages.length})</span>
            </h2>
            <button className="btn btn-primary" onClick={handleNew}>+ New</button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: 16, fontSize: 14 }}>Loading packages…</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="home-empty">
              <div className="home-empty-icon">🗺️</div>
              <h3>No packages yet</h3>
              <p>Click "New Itinerary" to create your first<br />Kashmir tour package.</p>
              <button className="btn-hero-primary" onClick={handleNew}>✨ Create First Package</button>
            </div>
          ) : (
            <div className="packages-grid">
              {packages.map(pkg => (
                <div key={pkg.id} className="pkg-card" onClick={() => navigate(`/editor/${pkg.id}`)}>
                  <div className="pkg-card-hero">
                    <img src={pkg.hero_photo_url || KASHMIR_IMG} alt={pkg.title} />
                    <div className="pkg-card-hero-overlay" />
                    <div className="pkg-card-hero-badge">
                      {pkg.nights}N / {pkg.days}D
                    </div>
                  </div>
                  <div className="pkg-card-body">
                    <div className="pkg-card-title">{pkg.title || 'Untitled Package'}</div>
                    <div className="pkg-card-sub">{pkg.sub_title || pkg.start_location || 'Shera Travels'}</div>
                    <div className="pkg-card-stats">
                      <div className="pkg-stat">
                        <span>🌙</span>
                        <span className="pkg-stat-val">{pkg.nights}</span>
                        <span>Nights</span>
                      </div>
                      <div className="pkg-stat">
                        <span>📅</span>
                        <span className="pkg-stat-val">{pkg.days}</span>
                        <span>Days</span>
                      </div>
                      <div className="pkg-stat">
                        <span>📍</span>
                        <span>{pkg.start_location ? pkg.start_location.split(',')[0] : 'Kashmir'}</span>
                      </div>
                    </div>
                    <div className="pkg-card-actions">
                      <button className="pkg-action-btn pkg-btn-edit" onClick={e => { e.stopPropagation(); navigate(`/editor/${pkg.id}`) }}>
                        ✏️ Edit
                      </button>
                      <button className="pkg-action-btn pkg-btn-preview" onClick={e => handlePreview(pkg, e)}>
                        👁 Preview
                      </button>
                      <button className="pkg-action-btn pkg-btn-del" onClick={e => handleDelete(pkg.id, e)}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewPkg && previewData && (
        <PreviewModal
          open
          pkg={previewPkg}
          prices={previewData.prices}
          days={previewData.days}
          onClose={() => { setPreviewPkg(null); setPreviewData(null) }}
          onPrint={() => window.print()}
        />
      )}
    </>
  )
}
