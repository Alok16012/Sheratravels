// ── PUBLIC BOOKING FORM ────────────────────────────────────
// Route: /booking/form/:token
// Customer fills their details + pays advance online
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { openRazorpayCheckout, isRazorpayConfigured } from '../lib/razorpay'
import { sendInvoiceEmail, isEmailConfigured } from '../lib/email'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

export default function BookingForm() {
  const { token }   = useParams()
  const { fetchBookingByToken, updateFromPublicForm, recordPayment } = useBooking()

  const [booking, setBooking]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)
  const [step, setStep]           = useState('form')   // 'form' | 'summary' | 'paid'
  const [paying, setPaying]       = useState(false)

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '', customer_whatsapp: '',
    adults: 1, children: 0, infants: 0,
    travel_date: '', return_date: '',
  })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  // Load booking by token
  useEffect(() => {
    fetchBookingByToken(token).then(b => {
      if (!b) { setNotFound(true); setLoading(false); return }
      setBooking(b)
      // Pre-fill from booking
      setForm({
        customer_name:      b.customer_name      || '',
        customer_email:     b.customer_email     || '',
        customer_phone:     b.customer_phone     || '',
        customer_whatsapp:  b.customer_whatsapp  || '',
        adults:             b.adults             || 1,
        children:           b.children           || 0,
        infants:            b.infants            || 0,
        travel_date:        b.travel_date        || '',
        return_date:        b.return_date        || '',
      })
      setLoading(false)
    })
  }, [token, fetchBookingByToken])

  const totalPax   = (parseInt(form.adults) || 0) + (parseInt(form.children) || 0) + (parseInt(form.infants) || 0)
  const totalAmt   = booking ? Number(booking.total_amount) : 0
  const advancePct = booking ? Number(booking.advance_percent || 20) : 20
  const advanceAmt = Math.round((totalAmt * advancePct) / 100)
  const balanceAmt = totalAmt - advanceAmt

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer_name.trim()) return
    // Save updated details
    const updated = await updateFromPublicForm(token, {
      customer_name:     form.customer_name,
      customer_email:    form.customer_email,
      customer_phone:    form.customer_phone,
      customer_whatsapp: form.customer_whatsapp,
      adults:            parseInt(form.adults)   || 0,
      children:          parseInt(form.children) || 0,
      infants:           parseInt(form.infants)  || 0,
      travel_date:       form.travel_date,
      return_date:       form.return_date,
    })
    if (updated) setBooking(updated)
    setStep('summary')
  }

  const handlePayNow = async () => {
    if (!isRazorpayConfigured) {
      toast.error('Online payment is not configured. Please contact the agency.')
      return
    }
    setPaying(true)
    try {
      const response = await openRazorpayCheckout({
        amount:  advanceAmt,
        booking: { ...booking, ...form, company_name: booking.packages?.company_name || 'Shera Travels' },
      })
      // Record payment
      await recordPayment(booking.id, {
        amount: advanceAmt,
        type:   'advance',
        method: 'razorpay',
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id:   response.razorpay_order_id,
      })
      // Send invoice email if configured
      if (isEmailConfigured && booking.customer_email) {
        try {
          await sendInvoiceEmail(booking, [])
        } catch (_) { /* silently ignore */ }
      }
      setStep('paid')
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') toast.error(err.message)
    }
    setPaying(false)
  }

  // ── LOADING ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={spinnerStyle} />
          <p style={{ color: '#64748B', marginTop: 16 }}>Loading booking details…</p>
        </div>
      </div>
    )
  }

  // ── NOT FOUND ─────────────────────────────────────────────
  if (notFound) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❓</div>
          <h2 style={{ color: '#0F172A', marginBottom: 8 }}>Booking Not Found</h2>
          <p style={{ color: '#64748B', fontSize: 14 }}>This booking link is invalid or has expired. Please contact Shera Travels.</p>
        </div>
      </div>
    )
  }

  // ── PAID SUCCESS ──────────────────────────────────────────
  if (step === 'paid') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>✈️ Shera Travels</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{booking.packages?.company_name || 'Let\'s Travel The World'}</div>
        </div>
        <div style={{ ...cardStyle, textAlign: 'center', padding: 48, maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#059669', fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Payment Successful!</h2>
          <div style={{ color: '#0F172A', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{booking.booking_ref}</div>
          <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Your advance payment of <strong style={{ color: '#10B981' }}>{fmt(advanceAmt)}</strong> has been received.
            A confirmation email will be sent to <strong>{form.customer_email || 'your email'}</strong>.
          </p>
          <div style={{ background: '#F0FDF4', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, marginBottom: 6 }}>BALANCE DUE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B' }}>{fmt(balanceAmt)}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>To be paid before travel date</div>
          </div>
          <p style={{ color: '#94A3B8', fontSize: 13 }}>
            For any queries, contact us at <strong>{booking.packages?.company_phone || '+91-9149406965'}</strong>
          </p>
        </div>
      </div>
    )
  }

  // ── SUMMARY ───────────────────────────────────────────────
  if (step === 'summary') {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>✈️ Shera Travels</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Booking Summary</div>
        </div>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={cardStyle}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
              📋 Booking Summary
            </h3>

            {/* Trip info */}
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={rowStyle}><span style={labelStyle}>Package</span><span style={valStyle}>{booking.packages?.title || 'Tour Package'}</span></div>
              <div style={rowStyle}><span style={labelStyle}>Destination</span><span style={valStyle}>{booking.destination || '—'}</span></div>
              <div style={rowStyle}><span style={labelStyle}>Travel Date</span><span style={valStyle}>{form.travel_date ? new Date(form.travel_date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '—'}</span></div>
              <div style={rowStyle}><span style={labelStyle}>Pax</span><span style={valStyle}>{form.adults} Adults{form.children > 0 ? `, ${form.children} Children` : ''}{form.infants > 0 ? `, ${form.infants} Infants` : ''}</span></div>
            </div>

            {/* Payment breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...rowStyle, padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 14 }}>Total Package Amount</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{fmt(totalAmt)}</span>
              </div>
              <div style={{ ...rowStyle, padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ color: '#64748B', fontSize: 14 }}>Advance to Pay Now ({advancePct}%)</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#10B981' }}>{fmt(advanceAmt)}</span>
              </div>
              <div style={{ ...rowStyle, padding: '10px 0' }}>
                <span style={{ color: '#64748B', fontSize: 14 }}>Balance (pay later)</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#F59E0B' }}>{fmt(balanceAmt)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={handlePayNow} disabled={paying} style={payBtnStyle}>
                {paying ? '⏳ Opening payment...' : `💳 Pay Advance Now — ${fmt(advanceAmt)}`}
              </button>
              <button onClick={() => setStep('form')} style={ghostBtnStyle}>
                ← Edit Details
              </button>
            </div>

            {!isRazorpayConfigured && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, fontSize: 12, color: '#92400E' }}>
                Online payment is currently unavailable. Please contact Shera Travels to complete payment.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── FORM ──────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>✈️ Shera Travels</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{booking.destination ? `${booking.destination} Tour` : 'Tour Booking'}</div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* Trip card */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4F6EF7,#6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              ✈️
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>{booking.packages?.title || 'Kashmir Tour Package'}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{booking.destination} • {booking.nights || booking.packages?.nights || 0} Nights</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: '#EEF2FF', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#4F6EF7' }}>
              💰 Total: {fmt(totalAmt)}
            </div>
            <div style={{ background: '#ECFDF5', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#10B981' }}>
              Pay Now: {fmt(advanceAmt)} ({advancePct}%)
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
            Fill Your Details
          </h3>
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={formSectionStyle}>Contact Details</div>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>Full Name *</label>
                <input style={inputStyle} required placeholder="Apna naam likhein" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>Email</label>
                <input style={inputStyle} type="email" placeholder="email@example.com" value={form.customer_email} onChange={e => set('customer_email', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>Phone</label>
                <input style={inputStyle} placeholder="+91 98765 43210" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>WhatsApp</label>
                <input style={inputStyle} placeholder="+91 98765 43210" value={form.customer_whatsapp} onChange={e => set('customer_whatsapp', e.target.value)} />
              </div>
            </div>

            <div style={formSectionStyle}>Travel Details</div>
            <div style={gridStyle}>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>Travel Date</label>
                <input style={inputStyle} type="date" value={form.travel_date} onChange={e => set('travel_date', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyleForm}>Return Date</label>
                <input style={inputStyle} type="date" value={form.return_date} onChange={e => set('return_date', e.target.value)} />
              </div>
            </div>

            <div style={formSectionStyle}>Travellers</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Adults (12+)',     field: 'adults' },
                { label: 'Children (5–12)', field: 'children' },
                { label: 'Infants (<5)',    field: 'infants' },
              ].map(({ label, field }) => (
                <div key={field} style={fieldStyle}>
                  <label style={labelStyleForm}>{label}</label>
                  <input style={inputStyle} type="number" min="0" value={form[field]}
                    onChange={e => set(field, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>

            <button type="submit" style={{ ...payBtnStyle, marginTop: 4 }}>
              Continue to Payment →
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16, lineHeight: 1.6 }}>
          Secure booking powered by Shera Travels<br/>
          📞 {booking.packages?.company_phone || '+91-9149406965'}
        </p>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────
const pageStyle   = { minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter,sans-serif', paddingBottom: 40 }
const headerStyle = { background: 'linear-gradient(135deg,#4F6EF7,#6366F1)', color: '#fff', padding: '20px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }
const cardStyle   = { background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }
const rowStyle    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }
const labelStyle  = { color: '#64748B', fontWeight: 600 }
const valStyle    = { fontWeight: 700, color: '#0F172A', textAlign: 'right', maxWidth: '60%' }
const fieldStyle  = { display: 'flex', flexDirection: 'column', gap: 6 }
const labelStyleForm = { fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }
const inputStyle  = { border: '1.5px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontFamily: 'Inter,sans-serif', color: '#0F172A', outline: 'none', width: '100%', boxSizing: 'border-box' }
const gridStyle   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
const spinnerStyle = { width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#4F6EF7', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto', display: 'block' }
const payBtnStyle = { background: 'linear-gradient(135deg,#4F6EF7,#6366F1)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Inter,sans-serif', boxShadow: '0 4px 14px rgba(79,110,247,0.3)', width: '100%', transition: 'all 0.18s' }
const ghostBtnStyle = { background: 'transparent', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter,sans-serif', width: '100%' }
const formSectionStyle = { fontSize: 11, fontWeight: 800, color: '#4F6EF7', textTransform: 'uppercase', letterSpacing: '0.8px', paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }
