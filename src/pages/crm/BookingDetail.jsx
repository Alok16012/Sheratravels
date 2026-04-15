import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBooking, BOOKING_STATUSES } from '../../context/BookingContext'
import { openRazorpayCheckout, isRazorpayConfigured } from '../../lib/razorpay'
import {
  sendInvoiceEmail, sendItineraryEmail,
  bookingConfirmationWA, paymentReminderWA,
  isEmailConfigured
} from '../../lib/email'
import { supabase } from '../../lib/supabase'
import CRMLayout from '../../components/crm/CRMLayout'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
function statusInfo(id) { return BOOKING_STATUSES.find(s => s.id === id) || BOOKING_STATUSES[0] }

// ── Manual Payment Modal ───────────────────────────────────
function ManualPaymentModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: booking.advance_amount || '',
    type: 'advance',
    method: 'cash',
    notes: '',
  })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="crm-modal-head">
          <div className="crm-modal-title">💰 Payment Record Karo</div>
          <button className="crm-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="crm-modal-body">
            <div className="crm-field">
              <label className="crm-label">Amount (₹) *</label>
              <input className="crm-input" type="number" min="1" required value={form.amount}
                onChange={e => set('amount', e.target.value)} />
            </div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Payment Type</label>
                <select className="crm-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="advance">Advance</option>
                  <option value="balance">Balance</option>
                  <option value="full">Full Payment</option>
                </select>
              </div>
              <div className="crm-field">
                <label className="crm-label">Method</label>
                <select className="crm-select" value={form.method} onChange={e => set('method', e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="crm-field">
              <label className="crm-label">Notes</label>
              <input className="crm-input" placeholder="UTR no. / transaction ID..." value={form.notes}
                onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="crm-modal-footer">
            <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-success">✓ Record Payment</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Detail Page ───────────────────────────────────────
export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentBooking: booking, payments, loading, fetchBooking, fetchPayments, updateBooking, recordPayment } = useBooking()

  const [activeTab, setActiveTab] = useState('details')
  const [pkg, setPkg]             = useState(null)
  const [days, setDays]           = useState([])
  const [prices, setPrices]       = useState([])
  const [showManualPay, setShowManualPay] = useState(false)
  const [sendingEmail, setSendingEmail]   = useState(false)
  const [payingOnline, setPayingOnline]   = useState(false)

  useEffect(() => {
    fetchBooking(id)
    fetchPayments(id)
  }, [id, fetchBooking, fetchPayments])

  // Load package details when booking is ready
  useEffect(() => {
    if (!booking?.package_id) return
    supabase.from('packages').select('*').eq('id', booking.package_id).single()
      .then(({ data }) => { if (data) setPkg(data) })
      .catch(() => {})
    supabase.from('prices').select('*').eq('package_id', booking.package_id)
      .then(({ data }) => { if (data) setPrices(data) })
      .catch(() => {})
    supabase.from('days').select('*, day_photos(*)').eq('package_id', booking.package_id).order('sort_order')
      .then(({ data }) => { if (data) setDays(data) })
      .catch(() => {})
  }, [booking?.package_id])

  // ── Razorpay online payment ─────────────────────────────
  const handleOnlinePayment = async (amount, type) => {
    if (!isRazorpayConfigured) {
      toast.error('Razorpay Key ID .env.local mein add karo: VITE_RAZORPAY_KEY_ID')
      return
    }
    setPayingOnline(true)
    try {
      const response = await openRazorpayCheckout({ amount, booking: { ...booking, company_name: pkg?.company_name || 'Shera Travels', company_phone: pkg?.company_phone } })
      await recordPayment(id, {
        amount,
        type,
        method: 'razorpay',
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id:   response.razorpay_order_id,
      })
      toast.success('Payment successful!')
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') toast.error(err.message)
    }
    setPayingOnline(false)
  }

  // ── Send invoice email ──────────────────────────────────
  const handleSendInvoice = async () => {
    if (!isEmailConfigured) {
      toast.error('Resend API Key .env.local mein add karo: VITE_RESEND_API_KEY')
      return
    }
    setSendingEmail(true)
    try {
      await sendInvoiceEmail({ ...booking, company_name: pkg?.company_name, company_phone: pkg?.company_phone, company_email: pkg?.company_email, company_addr: pkg?.company_addr }, payments)
      toast.success('Invoice email sent! 📧')
    } catch (e) {
      toast.error(e.message)
    }
    setSendingEmail(false)
  }

  // ── Send itinerary email ────────────────────────────────
  const handleSendItinerary = async () => {
    if (!isEmailConfigured) {
      toast.error('Resend API Key .env.local mein add karo: VITE_RESEND_API_KEY')
      return
    }
    setSendingEmail(true)
    try {
      await sendItineraryEmail({ ...booking, company_name: pkg?.company_name, company_phone: pkg?.company_phone }, pkg, days, prices)
      toast.success('Itinerary email sent! 📧')
    } catch (e) {
      toast.error(e.message)
    }
    setSendingEmail(false)
  }

  if (loading && !booking) {
    return <CRMLayout><div className="crm-loading"><div className="crm-spinner" /></div></CRMLayout>
  }
  if (!loading && !booking) {
    return (
      <CRMLayout>
        <div className="crm-empty">
          <div className="crm-empty-icon">❓</div>
          <h3>Booking not found</h3>
          <button className="crm-btn crm-btn-primary" onClick={() => navigate('/crm/bookings')}>← Back</button>
        </div>
      </CRMLayout>
    )
  }

  const st        = statusInfo(booking.status)
  const paidAmt   = Number(booking.paid_amount || 0)
  const totalAmt  = Number(booking.total_amount || 0)
  const balance   = Math.max(0, totalAmt - paidAmt)
  const advAmt    = Number(booking.advance_amount || 0)
  const advUnpaid = Math.max(0, advAmt - paidAmt)
  const paidPct   = totalAmt > 0 ? Math.round((paidAmt / totalAmt) * 100) : 0

  // WhatsApp links
  const waConfirmLink  = bookingConfirmationWA(booking)
  const waReminderLink = paymentReminderWA(booking)

  // Public form link
  const publicFormUrl = `${window.location.origin}/booking/form/${booking.booking_token}`

  const TABS = [
    { id: 'details',  label: 'Details',   icon: '📋' },
    { id: 'payments', label: 'Payments',  icon: '💳' },
    { id: 'comms',    label: 'Share',     icon: '📤' },
  ]

  return (
    <CRMLayout>
      {/* ── BACK + HEADER ── */}
      <div style={{ marginBottom: 20 }}>
        <button className="crm-btn crm-btn-ghost crm-btn-sm" onClick={() => navigate('/crm/bookings')} style={{ marginBottom: 16 }}>
          ← Back to Bookings
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{booking.booking_ref}</div>
              <span className="crm-badge" style={{ background: st.bg, color: st.color, fontSize: 12 }}>
                {st.emoji} {st.label}
              </span>
            </div>
            <div style={{ fontSize: 15, color: '#334155', fontWeight: 600 }}>
              {booking.customer_name} — {booking.destination || 'Tour'}
            </div>
          </div>

          {/* Status change */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              className="crm-select"
              value={booking.status}
              style={{ width: 'auto', fontWeight: 700, color: st.color, background: st.bg, borderColor: st.color }}
              onChange={e => updateBooking(id, { status: e.target.value })}
            >
              {BOOKING_STATUSES.map(s => (
                <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── PAYMENT PROGRESS BAR ── */}
      <div className="crm-card" style={{ padding: '18px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>TOTAL</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>{fmt(totalAmt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>PAID</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{fmt(paidAmt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>BALANCE</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: balance > 0 ? '#F59E0B' : '#10B981' }}>{fmt(balance)}</div>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4F6EF7' }}>{paidPct}%</div>
        </div>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${paidPct}%`, background: 'linear-gradient(90deg,#4F6EF7,#10B981)', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              fontFamily: 'Inter,sans-serif',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === t.id ? '#4F6EF7' : '#64748B',
              borderBottom: activeTab === t.id ? '2px solid #4F6EF7' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: DETAILS ══ */}
      {activeTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Customer card */}
          <div className="crm-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>Customer Details</div>
            {[
              { label: 'Name',      val: booking.customer_name },
              { label: 'Email',     val: booking.customer_email },
              { label: 'Phone',     val: booking.customer_phone },
              { label: 'WhatsApp',  val: booking.customer_whatsapp },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Trip card */}
          <div className="crm-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16 }}>Trip Details</div>
            {[
              { label: 'Destination',  val: booking.destination },
              { label: 'Travel Date',  val: booking.travel_date  ? new Date(booking.travel_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : null },
              { label: 'Return Date',  val: booking.return_date  ? new Date(booking.return_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : null },
              { label: 'Adults',       val: booking.adults },
              { label: 'Children',     val: booking.children },
              { label: 'Infants',      val: booking.infants },
              { label: 'Package',      val: pkg?.title },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 13 }}>
                <span style={{ color: '#94A3B8', fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="crm-card" style={{ padding: 24, gridColumn: '1/-1' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>Notes</div>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0 }}>{booking.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PAYMENTS ══ */}
      {activeTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action buttons */}
          <div className="crm-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
              Payment Actions
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Online payment — advance */}
              {advUnpaid > 0 && (
                <button
                  className="crm-btn crm-btn-primary"
                  disabled={payingOnline}
                  onClick={() => handleOnlinePayment(advUnpaid, 'advance')}
                >
                  {payingOnline ? '⏳ Opening...' : `💳 Pay Advance Online (${fmt(advUnpaid)})`}
                </button>
              )}
              {/* Online payment — balance */}
              {balance > 0 && paidAmt >= advAmt && (
                <button
                  className="crm-btn crm-btn-success"
                  disabled={payingOnline}
                  onClick={() => handleOnlinePayment(balance, 'balance')}
                >
                  {payingOnline ? '⏳ Opening...' : `💳 Pay Balance Online (${fmt(balance)})`}
                </button>
              )}
              {/* Manual payment */}
              <button className="crm-btn crm-btn-ghost" onClick={() => setShowManualPay(true)}>
                📝 Record Manual Payment
              </button>
            </div>

            {!isRazorpayConfigured && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E', border: '1px solid #FDE68A' }}>
                ⚠️ Razorpay online payment ke liye <strong>VITE_RAZORPAY_KEY_ID</strong> .env.local mein add karo. Tab tak manual payment use karo.
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="crm-table-card">
            <div className="crm-table-head">
              <div className="crm-table-title">Payment History</div>
            </div>
            {payments.length === 0 ? (
              <div className="crm-empty" style={{ padding: 32 }}>
                <div className="crm-empty-icon">💳</div>
                <p>Koi payment record nahi abhi</p>
              </div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.paid_at || p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><strong style={{ color: '#10B981' }}>{fmt(p.amount)}</strong></td>
                      <td><span className="crm-badge crm-badge-blue" style={{ textTransform: 'capitalize' }}>{p.type}</span></td>
                      <td><span className="crm-badge crm-badge-gray" style={{ textTransform: 'capitalize' }}>{p.method}</span></td>
                      <td><span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{p.razorpay_payment_id || p.notes || '—'}</span></td>
                      <td><span className="crm-badge crm-badge-green">✓ {p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: SHARE / COMMS ══ */}
      {activeTab === 'comms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Public Booking Form Link */}
          <div className="crm-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
              🔗 Public Booking Form Link
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 1.6 }}>
              Customer ko yeh link share karo. Wo apni details khud fill karenge aur online payment kar sakte hain.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="crm-input"
                readOnly
                value={publicFormUrl}
                style={{ fontFamily: 'monospace', fontSize: 12, flex: 1 }}
              />
              <button
                className="crm-btn crm-btn-primary"
                onClick={() => { navigator.clipboard.writeText(publicFormUrl); toast.success('Link copied!') }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {/* WhatsApp Section */}
          <div className="crm-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
              💬 WhatsApp Messages (Free — wa.me)
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {waConfirmLink && (
                <a className="crm-btn crm-btn-success" href={waConfirmLink} target="_blank" rel="noreferrer">
                  💬 Send Booking Confirmation
                </a>
              )}
              {waReminderLink && balance > 0 && (
                <a className="crm-btn crm-btn-ghost" href={waReminderLink} target="_blank" rel="noreferrer">
                  ⏰ Send Balance Reminder
                </a>
              )}
              {/* Share itinerary link on WhatsApp */}
              {booking.package_id && (() => {
                const itiUrl = `${window.location.origin}/itinerary/view/${booking.id}`
                const itiMsg = `Hi ${booking.customer_name}! 😊\n\nHere is your personalised itinerary for *${booking.destination || 'Kashmir'}*:\n👉 ${itiUrl}\n\n_Shera Travels — Let's Travel The World_ ✈️`
                const waItiLink = `https://wa.me/${(booking.customer_whatsapp||booking.customer_phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(itiMsg)}`
                return (
                  <a className="crm-btn" href={waItiLink} target="_blank" rel="noreferrer"
                    style={{ background: '#EEF2FF', color: '#4F6EF7', border: '1.5px solid #C7D7FD' }}>
                    📋 Share Itinerary Link
                  </a>
                )
              })()}
            </div>
            {!(booking.customer_whatsapp || booking.customer_phone) && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#F59E0B' }}>
                ⚠️ Customer ka phone number add karo to send WhatsApp messages.
              </p>
            )}
          </div>

          {/* Email Section */}
          <div className="crm-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
              📧 Email (Resend)
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="crm-btn crm-btn-primary"
                disabled={sendingEmail || !booking.customer_email}
                onClick={handleSendInvoice}
              >
                {sendingEmail ? '⏳ Sending...' : '📧 Send Invoice Email'}
              </button>
              <button
                className="crm-btn crm-btn-ghost"
                disabled={sendingEmail || !booking.customer_email || !booking.package_id}
                onClick={handleSendItinerary}
              >
                {sendingEmail ? '⏳ Sending...' : '📋 Send Itinerary Email'}
              </button>
            </div>
            {!booking.customer_email && (
              <p style={{ marginTop: 10, fontSize: 12, color: '#F59E0B' }}>
                ⚠️ Customer ka email add karo to send emails.
              </p>
            )}
            {!isEmailConfigured && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E', border: '1px solid #FDE68A' }}>
                ⚠️ Email ke liye <strong>VITE_RESEND_API_KEY</strong> .env.local mein add karo (resend.com — free tier).
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MANUAL PAYMENT MODAL ── */}
      {showManualPay && (
        <ManualPaymentModal
          booking={booking}
          onClose={() => setShowManualPay(false)}
          onSave={async (payData) => {
            await recordPayment(id, payData)
            setShowManualPay(false)
          }}
        />
      )}
    </CRMLayout>
  )
}
