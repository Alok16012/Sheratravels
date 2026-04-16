import { createContext, useContext, useReducer, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const BookingContext = createContext(null)

// ── Status config ──────────────────────────────────────────
export const BOOKING_STATUSES = [
  { id: 'confirmed',     label: 'Confirmed',     color: '#4F6EF7', bg: '#EEF2FF',  emoji: '✅' },
  { id: 'advance_paid',  label: 'Advance Paid',  color: '#10B981', bg: '#ECFDF5',  emoji: '💰' },
  { id: 'balance_due',   label: 'Balance Due',   color: '#F59E0B', bg: '#FFFBEB',  emoji: '⏳' },
  { id: 'fully_paid',    label: 'Fully Paid',    color: '#059669', bg: '#D1FAE5',  emoji: '🎉' },
  { id: 'completed',     label: 'Completed',     color: '#64748B', bg: '#F1F5F9',  emoji: '🏁' },
  { id: 'cancelled',     label: 'Cancelled',     color: '#EF4444', bg: '#FEE2E2',  emoji: '❌' },
]

// ── Booking ref generator ─────────────────────────────────
function genRef() {
  const yr  = new Date().getFullYear()
  const num = String(Math.floor(Math.random() * 9000) + 1000)
  return `ST-${yr}-${num}`
}

// ── localStorage mock helpers ─────────────────────────────
const mockGet  = (k) => JSON.parse(localStorage.getItem(k) || '[]')
const mockSave = (k, v) => localStorage.setItem(k, JSON.stringify(v))

// ── Reducer ───────────────────────────────────────────────
const initial = { bookings: [], currentBooking: null, payments: [], loading: false, saving: false }

function reducer(state, action) {
  switch (action.type) {
    case 'SET_BOOKINGS':  return { ...state, bookings: action.payload }
    case 'ADD_BOOKING':   return { ...state, bookings: [action.payload, ...state.bookings] }
    case 'UPD_BOOKING':   return {
      ...state,
      bookings: state.bookings.map(b => b.id === action.payload.id ? action.payload : b),
      currentBooking: state.currentBooking?.id === action.payload.id ? action.payload : state.currentBooking,
    }
    case 'SET_CURRENT':   return { ...state, currentBooking: action.payload }
    case 'DEL_BOOKING':   return { ...state, bookings: state.bookings.filter(b => b.id !== action.payload) }
    case 'SET_PAYMENTS':  return { ...state, payments: action.payload }
    case 'ADD_PAYMENT':   return { ...state, payments: [action.payload, ...state.payments] }
    case 'SET_LOADING':   return { ...state, loading: action.payload }
    case 'SET_SAVING':    return { ...state, saving: action.payload }
    default: return state
  }
}

// ── Provider ──────────────────────────────────────────────
export function BookingProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial)

  // ── Fetch all bookings ──────────────────────────────────
  const fetchBookings = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { data, error } = await supabase
        .from('bookings').select('*').order('created_at', { ascending: false })
      if (error) throw error
      dispatch({ type: 'SET_BOOKINGS', payload: data || [] })
    } catch {
      dispatch({ type: 'SET_BOOKINGS', payload: mockGet('crm_bookings') })
    }
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  // ── Fetch single booking ────────────────────────────────
  const fetchBooking = useCallback(async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single()
      if (error) throw error
      dispatch({ type: 'SET_CURRENT', payload: data })
    } catch {
      const b = mockGet('crm_bookings').find(x => x.id === id) || null
      dispatch({ type: 'SET_CURRENT', payload: b })
    }
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  // ── Fetch booking by public token (customer form) ───────
  const fetchBookingByToken = useCallback(async (token) => {
    try {
      const { data, error } = await supabase
        .from('bookings').select('*, packages(title, nights, days, company_name, company_phone)')
        .eq('booking_token', token).single()
      if (error) throw error
      return data
    } catch {
      return mockGet('crm_bookings').find(x => x.booking_token === token) || null
    }
  }, [])

  // ── Create booking ──────────────────────────────────────
  const createBooking = useCallback(async (formData) => {
    dispatch({ type: 'SET_SAVING', payload: true })
    try {
      const advance = Math.round((formData.total_amount * (formData.advance_percent || 20)) / 100)
      const row = {
        ...formData,
        booking_ref:    genRef(),
        advance_amount: advance,
        balance_amount: formData.total_amount - advance,
        paid_amount:    0,
        status:         'confirmed',
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }
      const { data, error } = await supabase.from('bookings').insert([row]).select().single()
      if (error) throw error
      dispatch({ type: 'ADD_BOOKING', payload: data })
      // Update lead stage to 'advance_paid' (silently handle if fails)
      if (formData.lead_id) {
        try {
          await supabase.from('leads').update({ stage: 'advance_paid', updated_at: new Date().toISOString() }).eq('id', formData.lead_id)
        } catch (e) {
          console.warn('Could not update lead stage:', e)
        }
      }
      toast.success(`Booking ${data.booking_ref} created!`)
      dispatch({ type: 'SET_SAVING', payload: false })
      return data
    } catch (e) {
      // localStorage fallback
      const advance = Math.round((formData.total_amount * (formData.advance_percent || 20)) / 100)
      const booking = {
        ...formData,
        id: crypto.randomUUID(),
        booking_ref: genRef(),
        booking_token: crypto.randomUUID(),
        advance_amount: advance,
        balance_amount: formData.total_amount - advance,
        paid_amount: 0,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const all = [booking, ...mockGet('crm_bookings')]
      mockSave('crm_bookings', all)
      dispatch({ type: 'ADD_BOOKING', payload: booking })
      toast.success(`Booking ${booking.booking_ref} created!`)
      dispatch({ type: 'SET_SAVING', payload: false })
      return booking
    }
  }, [])

  // ── Update booking ──────────────────────────────────────
  const updateBooking = useCallback(async (id, changes) => {
    const updated = { ...changes, updated_at: new Date().toISOString() }
    try {
      const { data } = await supabase.from('bookings').update(updated).eq('id', id).select().single()
      dispatch({ type: 'UPD_BOOKING', payload: data })
      return data
    } catch {
      const all = mockGet('crm_bookings')
      const found = all.find(b => b.id === id)
      const merged = { ...found, ...updated }
      mockSave('crm_bookings', all.map(b => b.id === id ? merged : b))
      dispatch({ type: 'UPD_BOOKING', payload: merged })
      return merged
    }
  }, [])

  // ── Delete booking ──────────────────────────────────────
  const deleteBooking = useCallback(async (id) => {
    try {
      await supabase.from('bookings').delete().eq('id', id)
    } catch {
      mockSave('crm_bookings', mockGet('crm_bookings').filter(b => b.id !== id))
    }
    dispatch({ type: 'DEL_BOOKING', payload: id })
    toast.success('Booking deleted')
  }, [])

  // ── Fetch payments for a booking ────────────────────────
  const fetchPayments = useCallback(async (bookingId) => {
    try {
      const { data } = await supabase.from('payments').select('*').eq('booking_id', bookingId).order('created_at', { ascending: false })
      dispatch({ type: 'SET_PAYMENTS', payload: data || [] })
    } catch {
      dispatch({ type: 'SET_PAYMENTS', payload: mockGet('crm_payments').filter(p => p.booking_id === bookingId) })
    }
  }, [])

  // ── Record payment (after Razorpay success) ─────────────
  const recordPayment = useCallback(async (bookingId, paymentData) => {
    const booking = state.bookings.find(b => b.id === bookingId) ||
      mockGet('crm_bookings').find(b => b.id === bookingId)
    if (!booking) return

    const newPaid = (Number(booking.paid_amount) || 0) + Number(paymentData.amount)
    const newStatus = newPaid >= booking.total_amount ? 'fully_paid'
      : newPaid >= booking.advance_amount ? 'balance_due'
      : booking.status

    const payRow = {
      booking_id: bookingId,
      amount: paymentData.amount,
      type: paymentData.type || 'advance',
      method: paymentData.method || 'razorpay',
      razorpay_payment_id: paymentData.razorpay_payment_id || null,
      razorpay_order_id: paymentData.razorpay_order_id || null,
      status: 'success',
      notes: paymentData.notes || '',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    try {
      const { data: pay } = await supabase.from('payments').insert([payRow]).select().single()
      dispatch({ type: 'ADD_PAYMENT', payload: pay })
    } catch {
      const p = { ...payRow, id: crypto.randomUUID() }
      mockSave('crm_payments', [p, ...mockGet('crm_payments')])
      dispatch({ type: 'ADD_PAYMENT', payload: p })
    }

    // Update booking paid_amount + status
    await updateBooking(bookingId, { paid_amount: newPaid, status: newStatus })
    toast.success(`₹${Number(paymentData.amount).toLocaleString('en-IN')} payment recorded!`)
  }, [state.bookings, updateBooking])

  // ── Update customer details from public form ─────────────
  const updateFromPublicForm = useCallback(async (token, formData) => {
    try {
      const { data } = await supabase
        .from('bookings')
        .update({ ...formData, updated_at: new Date().toISOString() })
        .eq('booking_token', token)
        .select().single()
      return data
    } catch {
      const all = mockGet('crm_bookings')
      const found = all.find(b => b.booking_token === token)
      if (!found) return null
      const merged = { ...found, ...formData }
      mockSave('crm_bookings', all.map(b => b.booking_token === token ? merged : b))
      return merged
    }
  }, [])

  // ── Stats ────────────────────────────────────────────────
  const getBookingStats = useCallback(() => {
    const b = state.bookings
    const totalRevenue = b.reduce((s, x) => s + (Number(x.paid_amount) || 0), 0)
    const pendingBalance = b.reduce((s, x) => s + Math.max(0, (Number(x.total_amount) || 0) - (Number(x.paid_amount) || 0)), 0)
    return {
      total:          b.length,
      confirmed:      b.filter(x => x.status === 'confirmed').length,
      advance_paid:   b.filter(x => x.status === 'advance_paid').length,
      balance_due:    b.filter(x => x.status === 'balance_due').length,
      fully_paid:     b.filter(x => x.status === 'fully_paid').length,
      completed:      b.filter(x => x.status === 'completed').length,
      totalRevenue,
      pendingBalance,
    }
  }, [state.bookings])

  return (
    <BookingContext.Provider value={{
      ...state,
      fetchBookings, fetchBooking, fetchBookingByToken,
      createBooking, updateBooking, deleteBooking,
      fetchPayments, recordPayment,
      updateFromPublicForm,
      getBookingStats,
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => useContext(BookingContext)
