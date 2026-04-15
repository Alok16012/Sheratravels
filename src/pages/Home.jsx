import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import { supabase } from '../lib/supabase'

export default function Home() {
  const { packages, fetchPackages, createNewPackage, loading } = usePackage()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalBookings: 0,
    activeRevenue: 0,
  })

  useEffect(() => {
    fetchPackages()
    loadQuickStats()
  }, [fetchPackages])

  const loadQuickStats = async () => {
    try {
      const [leadsRes, bookingsRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_amount')
      ])
      
      const revenue = (bookingsRes.data || []).reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0)
      
      setStats({
        totalLeads: leadsRes.count || 0,
        totalBookings: (bookingsRes.data || []).length,
        activeRevenue: revenue
      })
    } catch (e) {
      console.warn('Could not load extra stats:', e)
    }
  }

  const handleNew = async () => {
    const id = await createNewPackage()
    if (id) navigate(`/editor/${id}`)
  }

  const statCards = [
    { label: 'Total Packages', val: packages.length, icon: '📦', color: 'var(--primary)' },
    { label: 'New Leads', val: stats.totalLeads, icon: '👥', color: '#10b981' },
    { label: 'Confirmed Bookings', val: stats.totalBookings, icon: '📅', color: '#f59e0b' },
    { label: 'Total Revenue', val: `₹${stats.activeRevenue.toLocaleString()}`, icon: '💰', color: '#22d3ee' },
  ]

  return (
    <div className="home-dashboard">
      <div className="dashboard-header animate-fade">
        <div>
          <h1 className="text-gradient">Agency Overview</h1>
          <p className="text-muted">Welcome back. Here's a summary of your travel operations.</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <span>✨</span> Create New Itinerary
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="glass-card stat-card animate-fade" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="stat-content">
              <p className="stat-label">{s.label}</p>
              <h2 className="stat-value">{s.val}</h2>
            </div>
            <div className="stat-icon-wrap" style={{ 
               background: 'rgba(255, 255, 255, 0.05)',
               color: s.color,
            }}>
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        {/* Recent Packages */}
        <section className="dashboard-section animate-fade" style={{ animationDelay: '0.4s' }}>
          <div className="section-head">
            <h3>Recent Itineraries</h3>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>View All</button>
          </div>
          
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4">Loading...</td></tr>
                ) : packages.length === 0 ? (
                  <tr><td colSpan="4">No packages found.</td></tr>
                ) : packages.slice(0, 5).map(pkg => (
                  <tr key={pkg.id}>
                    <td>
                      <div className="pkg-name-cell">
                        <div className="pkg-mini-img">🗺️</div>
                        <span>{pkg.title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td>{pkg.nights}N / {pkg.days}D</td>
                    <td>{pkg.start_location || 'Kashmir'}</td>
                    <td>
                      <div className="table-actions" style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate(`/editor/${pkg.id}`)}>✏️</button>
                        <button className="btn btn-ghost" style={{ padding: '8px' }} onClick={() => navigate(`/crm/bookings?pkg=${pkg.id}`)}>📅</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Shortcuts / Quick Actions */}
        <aside className="dashboard-section animate-fade" style={{ animationDelay: '0.5s' }}>
          <div className="section-head">
            <h3>Quick Actions</h3>
          </div>
          <div className="shortcuts-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div className="glass-card shortcut-item" onClick={() => navigate('/crm/leads')}>
                <div className="shortcut-meta">
                   <h4>👤 New Lead</h4>
                   <p>Add a fresh inquiry</p>
                </div>
                <span>→</span>
             </div>
             <div className="glass-card shortcut-item">
                <div className="shortcut-meta">
                   <h4>✉️ Send Quote</h4>
                   <p>Email an itinerary</p>
                </div>
                <span>→</span>
             </div>
             <div className="glass-card shortcut-item" onClick={() => navigate('/admin')}>
                <div className="shortcut-meta">
                   <h4>🛠️ Config</h4>
                   <p>System settings</p>
                </div>
                <span>→</span>
             </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .dashboard-header { margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
        .dashboard-header h1 { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }
        .stat-card {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .stat-label { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
        .stat-value { font-size: 28px; font-weight: 800; }
        .stat-icon-wrap { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
        
        .dashboard-sections { display: grid; grid-template-columns: 2.5fr 1fr; gap: 32px; }
        @media (max-width: 1024px) { .dashboard-sections { grid-template-columns: 1fr; } }
        
        .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .section-head h3 { font-size: 18px; font-weight: 800; }
        
        .pkg-name-cell { display: flex; align-items: center; gap: 12px; font-weight: 600; }
        .pkg-mini-img { width: 32px; height: 32px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border-radius: 8px; }

        .shortcut-item { 
          padding: 20px; 
          cursor: pointer; 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          transition: var(--transition);
        }
        .shortcut-item:hover { transform: translateX(5px); background: rgba(255,255,255,0.05); }
        .shortcut-item h4 { font-size: 15px; margin-bottom: 2px; }
        .shortcut-item p { font-size: 12px; color: var(--text-dim); }
        .shortcut-item span { color: var(--primary); font-weight: 800; }
      `}</style>
    </div>
  )
}
