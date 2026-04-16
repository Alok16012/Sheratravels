import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking, BOOKING_STATUSES } from '../../context/BookingContext'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function Bookings() {
  const navigate = useNavigate()
  const { bookings, loading, fetchBookings, deleteBooking, getBookingStats } = useBooking()
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const stats = getBookingStats()
  const filteredBookings = bookings.filter(b => {
    const q = search.toLowerCase()
    const matchesSearch = b.customer_name?.toLowerCase().includes(q) || b.booking_ref?.toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="bookings-dashboard">
      <div className="bookings-header">
        <div>
          <h1 className="text-gradient">Bookings & Revenue</h1>
          <p className="text-muted">{bookings.length} reservations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/crm/leads')}>
          + New Booking
        </button>
      </div>

      <div className="booking-stats">
        <div className="booking-stat glass-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <span>💰</span>
          </div>
          <div>
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">{fmt(stats.totalRevenue)}</p>
          </div>
        </div>
        <div className="booking-stat glass-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
            <span>⏳</span>
          </div>
          <div>
            <p className="stat-label">Pending Balance</p>
            <p className="stat-value" style={{ color: '#f59e0b' }}>{fmt(stats.pendingBalance)}</p>
          </div>
        </div>
        <div className="booking-stat glass-card">
          <div className="stat-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
            <span>✅</span>
          </div>
          <div>
            <p className="stat-label">Confirmed</p>
            <p className="stat-value" style={{ color: '#6366f1' }}>{stats.confirmed}</p>
          </div>
        </div>
      </div>

      <div className="filter-row">
        <input className="glass-input search-input" placeholder="Search ref or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-pills">
          <button className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
          {BOOKING_STATUSES.slice(0, 4).map(s => (
            <button key={s.id} className={`filter-pill ${statusFilter === s.id ? 'active' : ''}`} onClick={() => setStatusFilter(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card bookings-list-card">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>No bookings yet</h3>
            <p>Create a booking from your leads</p>
          </div>
        ) : (
          filteredBookings.map(b => (
            <div key={b.id} className="booking-item" onClick={() => navigate(`/crm/bookings/${b.id}`)}>
              <div className="booking-ref">
                <span className="ref-badge">{b.booking_ref}</span>
              </div>
              <div className="booking-info">
                <p className="booking-name">{b.customer_name}</p>
                <p className="booking-meta">{b.customer_phone}</p>
              </div>
              <div className="booking-amount">
                <p className="amount-total">{fmt(b.total_amount)}</p>
                <p className="amount-due">Due: {fmt(b.balance_amount)}</p>
              </div>
              <div className="booking-status">
                <span className="status-badge" style={{ color: BOOKING_STATUSES.find(s => s.id === b.status)?.color }}>
                  {BOOKING_STATUSES.find(s => s.id === b.status)?.label || b.status}
                </span>
              </div>
              <button className="view-btn">👁️</button>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .bookings-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          gap: 16px;
        }
        .bookings-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .bookings-header .btn { white-space: nowrap; }
        
        .booking-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .booking-stat {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 800;
        }
        
        .filter-row {
          margin-bottom: 20px;
        }
        .search-input {
          max-width: 300px;
          margin-bottom: 12px;
        }
        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .filter-pill.active {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        
        .bookings-list-card {
          padding: 0;
          overflow: hidden;
        }
        .booking-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-glass);
          cursor: pointer;
          transition: background 0.15s;
        }
        .booking-item:last-child {
          border-bottom: none;
        }
        .booking-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .booking-ref {
          flex-shrink: 0;
        }
        .ref-badge {
          font-family: var(--mono);
          color: var(--primary);
          font-weight: 700;
          font-size: 13px;
          padding: 4px 10px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
        }
        .booking-info {
          flex: 1;
          min-width: 0;
        }
        .booking-name {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .booking-meta {
          font-size: 12px;
          color: var(--text-dim);
        }
        .booking-amount {
          text-align: right;
          flex-shrink: 0;
        }
        .amount-total {
          font-weight: 800;
          font-size: 15px;
        }
        .amount-due {
          font-size: 11px;
          color: #f59e0b;
          font-weight: 600;
        }
        .booking-status {
          flex-shrink: 0;
        }
        .status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
        }
        .view-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.03);
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .empty-state {
          padding: 48px 20px;
          text-align: center;
        }
        .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-state h3 { font-size: 18px; margin-bottom: 6px; }
        .empty-state p { color: var(--text-dim); }
        
        @media (max-width: 768px) {
          .bookings-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .bookings-header h1 { font-size: 22px; }
          .bookings-header .btn { width: 100%; justify-content: center; }
          
          .booking-stats { grid-template-columns: 1fr; gap: 12px; }
          .booking-stat { padding: 16px; }
          
          .filter-pills {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
          }
          .filter-pill { white-space: nowrap; }
          
          .booking-item {
            padding: 14px 16px;
            gap: 12px;
            flex-wrap: wrap;
          }
          .booking-ref { display: none; }
          .booking-info { flex: 1; }
          .booking-amount { order: -1; }
          .view-btn { width: 32px; height: 32px; font-size: 12px; }
        }
        @media (max-width: 480px) {
          .booking-amount { display: none; }
          .booking-status { display: none; }
        }
      `}</style>
    </div>
  )
}
