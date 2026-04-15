import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function MainLayout({ children, headerActions }) {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('shara_auth')
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/crm/leads', label: 'Leads', icon: '👥' },
    { path: '/crm/bookings', label: 'Bookings', icon: '📅' },
    { path: '/admin', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className="sidebar-nav">
        <NavLink to="/" className="brand">
          <div className="brand-logo">ST</div>
          <span className="brand-name">Shera Travels</span>
        </NavLink>

        <nav className="nav-links">
          {navItems.map(item => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-viewport">
        <header className="main-header">
          <div className="header-left">
            <h2 className="text-gradient">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="header-right">
            {headerActions && <div className="header-actions-wrap">{headerActions}</div>}
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', fontWeight: '700' }}>Admin User</p>
                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Super Admin</p>
              </div>
              <div style={{ 
                width: 40, height: 40, background: 'var(--primary)', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontWeight: '800', fontSize: '14px' 
              }}>AD</div>
            </div>
          </div>
        </header>

        <div className="page-workspace animate-fade">
          {children}
        </div>
      </main>
    </div>
  )
}
