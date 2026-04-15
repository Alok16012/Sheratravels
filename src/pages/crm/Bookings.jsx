import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking, BOOKING_STATUSES } from '../../context/BookingContext'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      await deleteBooking(id)
      toast.success('Booking deleted')
    }
  }

  return (
    <div className="bookings-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Bookings & Revenue</h1>
          <p className="text-muted">Managing {bookings.length} reservations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/crm/leads?stage=negotiating')}>
          <span>+</span> Create From Lead
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ padding: '24px', flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '24px' }}>💰</div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Revenue</span>
            <h3 style={{ fontSize: '24px', fontWeights: '800' }}>{fmt(stats.totalRevenue)}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px', flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '24px', color: '#f59e0b' }}>⏳</div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Balance</span>
            <h3 style={{ fontSize: '24px', fontWeights: '800' }}>{fmt(stats.pendingBalance)}</h3>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '24px', flex: 1, minWidth: '240px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '24px', color: '#10b981' }}>✅</div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed</span>
            <h3 style={{ fontSize: '24px', fontWeights: '800' }}>{stats.confirmed}</h3>
          </div>
        </div>
      </div>

      <div className="glass-card animate-fade" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', gap: '24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <input className="glass-input" placeholder="Search ref or customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px' }}>
            <button className={`btn btn-ghost ${statusFilter === 'all' ? 'btn-primary' : ''}`} style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setStatusFilter('all')}>All</button>
            {BOOKING_STATUSES.map(s => (
              <button 
                key={s.id} 
                className={`btn btn-ghost ${statusFilter === s.id ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', fontSize: '12px' }}
                onClick={() => setStatusFilter(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => (
                <tr key={b.id} onClick={() => navigate(`/crm/bookings/${b.id}`)} style={{ cursor: 'pointer' }}>
                  <td><span style={{ fontFamily: 'var(--mono)', color: 'var(--primary)', fontWeight: '700' }}>{b.booking_ref}</span></td>
                  <td>
                    <div>
                      <p style={{ fontWeight: '700' }}>{b.customer_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{b.customer_phone}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p style={{ fontWeight: '800' }}>{fmt(b.total_amount)}</p>
                      <p style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>Due: {fmt(b.balance_amount)}</p>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', 
                      fontWeight: '800', background: 'rgba(255,255,255,0.05)',
                      color: BOOKING_STATUSES.find(s => s.id === b.status)?.color || '#fff'
                    }}>
                      {BOOKING_STATUSES.find(s => s.id === b.status)?.label || b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                       <button className="btn btn-ghost" style={{ padding: '8px' }}>👁️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
