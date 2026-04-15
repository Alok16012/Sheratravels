import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking, BOOKING_STATUSES } from '../../context/BookingContext'
import { useCRM } from '../../context/CRMContext'
import { supabase } from '../../lib/supabase'
import CRMLayout from '../../components/crm/CRMLayout'

// ── Helpers ────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
function statusInfo(id) { return BOOKING_STATUSES.find(s => s.id === id) || BOOKING_STATUSES[0] }
function daysAgo(d) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return '1d ago'
  return `${diff}d ago`
}

// ── Create Booking Modal ───────────────────────────────────
function CreateBookingModal({ onClose, onSave, saving }) {
  const { leads } = useCRM()
  const [packages, setPackages] = useState([])
  const [prices,   setPrices]   = useState([])
  const [form, setForm] = useState({
    lead_id: '', package_id: '',
    customer_name: '', customer_email: '', customer_phone: '', customer_whatsapp: '',
    destination: '', travel_date: '', return_date: '', nights: 0,
    adults: 1, children: 0, infants: 0,
    total_amount: 0, advance_percent: 20,
    notes: '',
  })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  // Load packages once
  useEffect(() => {
    supabase.from('packages').select('id, title, nights, days, start_location')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPackages(data || []))
      .catch(() => {
        const mock = JSON.parse(localStorage.getItem('mock_packages') || '[]')
        setPackages(mock)
      })
  }, [])

  // When lead selected → auto-fill customer info
  const handleLeadChange = (leadId) => {
    set('lead_id', leadId)
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return
    setForm(p => ({
      ...p,
      lead_id:            leadId,
      customer_name:      lead.name      || p.customer_name,
      customer_email:     lead.email     || p.customer_email,
      customer_phone:     lead.phone     || p.customer_phone,
      customer_whatsapp:  lead.whatsapp  || p.customer_whatsapp,
      destination:        lead.destination || p.destination,
      travel_date:        lead.travel_date  || p.travel_date,
      return_date:        lead.return_date  || p.return_date,
      adults:             lead.adults    || p.adults,
      children:           lead.children  || p.children,
      infants:            lead.infants   || p.infants,
    }))
  }

  // When package selected → load prices + auto-calc amount
  const handlePkgChange = async (pkgId) => {
    set('package_id', pkgId)
    if (!pkgId) { setPrices([]); return }
    const pkg = packages.find(p => p.id === pkgId)
    if (pkg?.nights) set('nights', pkg.nights)
    try {
      const { data } = await supabase.from('prices').select('*').eq('package_id', pkgId)
      const list = data || []
      setPrices(list)
      calcTotal(list, form.adults, form.children, form.infants)
    } catch {
      setPrices([])
    }
  }

  // Auto-calculate total based on pax × price
  const calcTotal = (priceList, adults, children, infants) => {
    const adultP  = priceList.find(p => p.pax_type === 'Adult')?.price  || 0
    const childP  = priceList.find(p => p.pax_type === 'Child')?.price  || 0
    const infantP = priceList.find(p => p.pax_type === 'Infant')?.price || 0
    const total = (adults * adultP) + (children * childP) + (infants * infantP)
    set('total_amount', total)
  }

  const handlePaxChange = (field, val) => {
    const v = parseInt(val) || 0
    set(field, v)
    const a = field === 'adults'   ? v : form.adults
    const c = field === 'children' ? v : form.children
    const i = field === 'infants'  ? v : form.infants
    calcTotal(prices, a, c, i)
  }

  const advance = Math.round((form.total_amount * form.advance_percent) / 100)
  const balance = form.total_amount - advance

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.customer_name.trim()) return
    onSave({ ...form, advance_amount: advance, balance_amount: balance })
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="crm-modal-head">
          <div className="crm-modal-title">🎫 New Booking Banao</div>
          <button className="crm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="crm-modal-body">
            {/* Link lead */}
            <div className="crm-form-section">Lead Link Karo (Optional)</div>
            <div className="crm-field">
              <label className="crm-label">Lead Select Karo</label>
              <select className="crm-select" value={form.lead_id} onChange={e => handleLeadChange(e.target.value)}>
                <option value="">— Koi lead link nahi —</option>
                {leads.filter(l => !['completed','lost'].includes(l.stage)).map(l => (
                  <option key={l.id} value={l.id}>{l.name} — {l.destination || 'No destination'} ({l.phone || l.whatsapp || 'No phone'})</option>
                ))}
              </select>
            </div>

            {/* Package */}
            <div className="crm-form-section">Package Select Karo</div>
            <div className="crm-field">
              <label className="crm-label">Itinerary Package</label>
              <select className="crm-select" value={form.package_id} onChange={e => handlePkgChange(e.target.value)}>
                <option value="">— Package select karo —</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.nights}N/{p.days}D)</option>
                ))}
              </select>
              {prices.length > 0 && (
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                  Prices: {prices.map(p => `${p.pax_type}: ₹${Number(p.price).toLocaleString('en-IN')}`).join(' | ')}
                </div>
              )}
            </div>

            {/* Customer details */}
            <div className="crm-form-section">Customer Details</div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Customer Name *</label>
                <input className="crm-input" value={form.customer_name} required placeholder="Full name"
                  onChange={e => set('customer_name', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Email</label>
                <input className="crm-input" type="email" value={form.customer_email} placeholder="email@example.com"
                  onChange={e => set('customer_email', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Phone</label>
                <input className="crm-input" value={form.customer_phone} placeholder="+91 98765 43210"
                  onChange={e => set('customer_phone', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">WhatsApp</label>
                <input className="crm-input" value={form.customer_whatsapp} placeholder="+91 98765 43210"
                  onChange={e => set('customer_whatsapp', e.target.value)} />
              </div>
            </div>

            {/* Trip details */}
            <div className="crm-form-section">Trip Details</div>
            <div className="crm-field">
              <label className="crm-label">Destination</label>
              <input className="crm-input" value={form.destination} placeholder="e.g. Kashmir, Gulmarg"
                onChange={e => set('destination', e.target.value)} />
            </div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Travel Date</label>
                <input className="crm-input" type="date" value={form.travel_date}
                  onChange={e => set('travel_date', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Return Date</label>
                <input className="crm-input" type="date" value={form.return_date}
                  onChange={e => set('return_date', e.target.value)} />
              </div>
            </div>
            <div className="crm-grid-3">
              <div className="crm-field">
                <label className="crm-label">Adults</label>
                <input className="crm-input" type="number" min="0" value={form.adults}
                  onChange={e => handlePaxChange('adults', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Children</label>
                <input className="crm-input" type="number" min="0" value={form.children}
                  onChange={e => handlePaxChange('children', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Infants</label>
                <input className="crm-input" type="number" min="0" value={form.infants}
                  onChange={e => handlePaxChange('infants', e.target.value)} />
              </div>
            </div>

            {/* Amount */}
            <div className="crm-form-section">Amount</div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Total Amount (₹)</label>
                <input className="crm-input" type="number" min="0" value={form.total_amount}
                  onChange={e => set('total_amount', Number(e.target.value) || 0)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Advance %</label>
                <input className="crm-input" type="number" min="1" max="100" value={form.advance_percent}
                  onChange={e => set('advance_percent', Number(e.target.value) || 20)} />
              </div>
            </div>

            {/* Amount preview */}
            {form.total_amount > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 2 }}>TOTAL</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{fmt(form.total_amount)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 2 }}>ADVANCE ({form.advance_percent}%)</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{fmt(advance)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 2 }}>BALANCE</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B' }}>{fmt(balance)}</div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="crm-field">
              <label className="crm-label">Notes</label>
              <textarea className="crm-textarea" rows={2} placeholder="Koi special requirement..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          <div className="crm-modal-footer">
            <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={saving}>
              {saving ? '⏳ Creating...' : '🎫 Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bookings List Page ─────────────────────────────────────
export default function Bookings() {
  const navigate = useNavigate()
  const { bookings, loading, saving, fetchBookings, createBooking, deleteBooking, getBookingStats } = useBooking()
  const [showCreate, setShowCreate] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const stats    = getBookingStats()
  const filtered = bookings.filter(b => !statusFilter || b.status === statusFilter)

  const handleCreate = async (formData) => {
    const booking = await createBooking(formData)
    setShowCreate(false)
    if (booking) navigate(`/crm/bookings/${booking.id}`)
  }

  return (
    <CRMLayout>
      {/* ── PAGE HEADER ── */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-title">Bookings</div>
          <div className="crm-page-sub">{bookings.length} total bookings</div>
        </div>
        <div className="crm-page-actions">
          <button className="crm-btn crm-btn-primary" onClick={() => setShowCreate(true)}>
            + New Booking
          </button>
        </div>
      </div>

      {/* ── STAT STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total',       val: stats.total,        color: '#4F6EF7' },
          { label: 'Confirmed',   val: stats.confirmed,    color: '#6366F1' },
          { label: 'Adv. Paid',   val: stats.advance_paid, color: '#10B981' },
          { label: 'Bal. Due',    val: stats.balance_due,  color: '#F59E0B' },
          { label: 'Fully Paid',  val: stats.fully_paid,   color: '#059669' },
          { label: 'Completed',   val: stats.completed,    color: '#64748B' },
        ].map(s => (
          <div key={s.label} className="crm-card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── REVENUE STRIP ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div className="crm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💰</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>{fmt(stats.totalRevenue)}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Total Revenue Collected</div>
          </div>
        </div>
        <div className="crm-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#F59E0B' }}>{fmt(stats.pendingBalance)}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Pending Balance</div>
          </div>
        </div>
      </div>

      {/* ── STATUS FILTER TABS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          className={`crm-btn crm-btn-sm ${!statusFilter ? 'crm-btn-primary' : 'crm-btn-ghost'}`}
          onClick={() => setStatusFilter('')}
        >
          All ({bookings.length})
        </button>
        {BOOKING_STATUSES.map(s => (
          <button
            key={s.id}
            className={`crm-btn crm-btn-sm ${statusFilter === s.id ? 'crm-btn-primary' : 'crm-btn-ghost'}`}
            onClick={() => setStatusFilter(statusFilter === s.id ? '' : s.id)}
          >
            {s.emoji} {s.label} ({bookings.filter(b => b.status === s.id).length})
          </button>
        ))}
      </div>

      {/* ── BOOKINGS TABLE ── */}
      {loading && bookings.length === 0 ? (
        <div className="crm-loading"><div className="crm-spinner" /><p>Loading bookings…</p></div>
      ) : filtered.length === 0 ? (
        <div className="crm-card">
          <div className="crm-empty">
            <div className="crm-empty-icon">🎫</div>
            <h3>{bookings.length === 0 ? 'Koi booking nahi abhi' : 'Is filter mein koi booking nahi'}</h3>
            <p>Leads page se lead ko booking mein convert karo</p>
            {bookings.length === 0 && (
              <button className="crm-btn crm-btn-primary" style={{ marginTop: 14 }} onClick={() => setShowCreate(true)}>
                + First Booking Banao
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="crm-table-card">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Travel Date</th>
                <th>Total</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => {
                const st = statusInfo(b.status)
                return (
                  <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/crm/bookings/${b.id}`)}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#4F6EF7', fontSize: 13 }}>{b.booking_ref}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{daysAgo(b.created_at)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{b.customer_name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.customer_phone || b.customer_whatsapp || '—'}</div>
                    </td>
                    <td><div style={{ fontWeight: 600, fontSize: 13 }}>{b.destination || '—'}</div></td>
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {b.travel_date ? new Date(b.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </div>
                    </td>
                    <td><div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{fmt(b.total_amount)}</div></td>
                    <td><div style={{ fontWeight: 700, fontSize: 13, color: '#10B981' }}>{fmt(b.advance_amount)}</div></td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 13, color: Number(b.balance_amount) > 0 ? '#F59E0B' : '#10B981' }}>
                        {fmt(Math.max(0, Number(b.total_amount) - Number(b.paid_amount)))}
                      </div>
                    </td>
                    <td>
                      <span className="crm-badge" style={{ background: st.bg, color: st.color }}>
                        {st.emoji} {st.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="crm-action-btn crm-action-view"
                          onClick={() => navigate(`/crm/bookings/${b.id}`)} title="View">👁</button>
                        <button className="crm-action-btn"
                          style={{ background: '#FEE2E2', color: '#EF4444' }}
                          onClick={() => window.confirm(`Delete booking ${b.booking_ref}?`) && deleteBooking(b.id)}
                          title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateBookingModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
          saving={saving}
        />
      )}
    </CRMLayout>
  )
}
