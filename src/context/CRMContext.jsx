// @refresh reset
import React, { createContext, useContext, useReducer, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const CRMContext = createContext(null)

export const LEAD_STAGES = [
  { id: 'new_inquiry',   label: 'New Inquiry',       color: '#4F6EF7', bg: '#EEF2FF', emoji: '🆕' },
  { id: 'contacted',     label: 'Contacted',          color: '#6366F1', bg: '#F0F0FF', emoji: '📞' },
  { id: 'itinerary_sent',label: 'Itinerary Sent',     color: '#8B5CF6', bg: '#F5F3FF', emoji: '📋' },
  { id: 'negotiation',   label: 'Negotiation',        color: '#F59E0B', bg: '#FFFBEB', emoji: '💬' },
  { id: 'advance_paid',  label: 'Advance Paid',       color: '#10B981', bg: '#ECFDF5', emoji: '💰' },
  { id: 'documents',     label: 'Docs Collected',     color: '#14B8A6', bg: '#F0FDFA', emoji: '📄' },
  { id: 'trip_ongoing',  label: 'Trip Ongoing',       color: '#0EA5E9', bg: '#F0F9FF', emoji: '✈️' },
  { id: 'completed',     label: 'Completed',          color: '#059669', bg: '#D1FAE5', emoji: '✅' },
  { id: 'lost',           label: 'Lost',               color: '#EF4444', bg: '#FEF2F2', emoji: '❌' },
]

export const LEAD_SOURCES = [
  'WhatsApp', 'Phone Call', 'Walk-in',
  'Website', 'Referral', 'Social Media',
  'JustDial', 'Other',
]

const initialState = {
  leads:      [],
  loading:    false,
  saving:     false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LEADS':   return { ...state, leads: action.payload }
    case 'ADD_LEAD':    return { ...state, leads: [action.payload, ...state.leads] }
    case 'UPDATE_LEAD': return { ...state, leads: state.leads.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'REMOVE_LEAD': return { ...state, leads: state.leads.filter(l => l.id !== action.payload) }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_SAVING':  return { ...state, saving: action.payload }
    default: return state
  }
}

function getMockLeads() {
  return JSON.parse(localStorage.getItem('crm_leads') || '[]')
}
function saveMockLeads(leads) {
  localStorage.setItem('crm_leads', JSON.stringify(leads))
}

export function CRMProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchLeads = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const local = getMockLeads()
    try {
      const { data, error } = await supabase
        .from('leads').select('*').order('created_at', { ascending: false })
      if (error) {
        console.warn('Supabase fetch error, using local:', error.message)
        dispatch({ type: 'SET_LEADS', payload: local })
      } else {
        // Merge remote + local so leads saved only locally (when Supabase
        // insert is blocked by RLS) don't disappear. Remote wins on conflict.
        const remoteIds = new Set((data || []).map(l => l.id))
        const localOnly = local.filter(l => !remoteIds.has(l.id))
        const merged = [...(data || []), ...localOnly]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        dispatch({ type: 'SET_LEADS', payload: merged })
      }
    } catch {
      dispatch({ type: 'SET_LEADS', payload: local })
    }
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  const addLead = useCallback(async (formData) => {
    dispatch({ type: 'SET_SAVING', payload: true })
    const stage = formData.stage === 'new' ? 'new_inquiry' : formData.stage
    const lead = { 
      ...formData, 
      id: crypto.randomUUID(), 
      stage, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    }
    try {
      const { data, error } = await supabase.from('leads').insert([lead]).select().single()
      if (error) {
        console.error('Supabase insert error:', error.message)
        throw error
      }
      console.log('Lead saved to Supabase:', data)
      dispatch({ type: 'ADD_LEAD', payload: data || lead })
      toast.success('Lead saved!')
      dispatch({ type: 'SET_SAVING', payload: false })
      return data || lead
    } catch (err) {
      console.log('Saving to localStorage instead')
      const all = [lead, ...getMockLeads()]
      saveMockLeads(all)
      dispatch({ type: 'ADD_LEAD', payload: lead })
      toast.success('Lead saved!')
      dispatch({ type: 'SET_SAVING', payload: false })
      return lead
    }
  }, [])

  const updateLead = useCallback(async (id, changes) => {
    const updated = { ...changes, updated_at: new Date().toISOString() }
    try {
      await supabase.from('leads').update(updated).eq('id', id)
    } catch { /* ignore — local copy below keeps it in sync */ }
    // Always mirror to localStorage so local-only leads persist edits too
    const local = getMockLeads()
    if (local.some(l => l.id === id)) {
      saveMockLeads(local.map(l => l.id === id ? { ...l, ...updated } : l))
    }
    dispatch({ type: 'UPDATE_LEAD', payload: { ...state.leads.find(l => l.id === id), ...updated, id } })
    toast.success('Lead updated!')
  }, [state.leads])

  const changeStage = useCallback(async (leadId, newStage) => {
    const lead = state.leads.find(l => l.id === leadId)
    if (!lead || lead.stage === newStage) return
    const newStageLabel = LEAD_STAGES.find(s => s.id === newStage)?.label || newStage
    await updateLead(leadId, { stage: newStage })
    toast.success(`Stage: ${newStageLabel}`)
  }, [state.leads])

  const deleteLead = useCallback(async (id) => {
    try {
      await supabase.from('leads').delete().eq('id', id)
    } catch { /* ignore */ }
    // Always remove from localStorage too so local-only leads are deleted
    saveMockLeads(getMockLeads().filter(l => l.id !== id))
    dispatch({ type: 'REMOVE_LEAD', payload: id })
    toast.success('Lead deleted')
  }, [])

  const getStats = useCallback(() => {
    const leads = state.leads
    const now = new Date()
    const thisMonth = leads.filter(l => {
      const d = new Date(l.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const active = leads.filter(l => !['completed', 'lost'].includes(l.stage))
    const hot    = leads.filter(l => l.stage === 'negotiation')
    const booked = leads.filter(l => ['advance_paid', 'documents', 'trip_ongoing', 'completed'].includes(l.stage))
    const stageDist = LEAD_STAGES.map(s => ({...s, count: leads.filter(l => l.stage === s.id).length}))
    const monthly = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const label = d.toLocaleString('default', { month: 'short' })
      const count = leads.filter(l => {
        const ld = new Date(l.created_at)
        return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear()
      }).length
      monthly.push({ label, count })
    }
    return { total: leads.length, thisMonth: thisMonth.length, active: active.length, hot: hot.length, booked: booked.length, stageDist, monthly }
  }, [state.leads])

  return (
    <CRMContext.Provider value={{
      ...state,
      fetchLeads, addLead, updateLead, changeStage, deleteLead,
      getStats,
    }}>
      {children}
    </CRMContext.Provider>
  )
}

export const useCRM = () => useContext(CRMContext)
