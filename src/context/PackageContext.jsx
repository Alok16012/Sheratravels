import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react'
// Triggering fresh Vercel build with clean code
import { supabase, uploadPhoto, deletePhoto } from '../lib/supabase'
import toast from 'react-hot-toast'

const PackageContext = createContext(null)

const DEFAULT_PACKAGE = {
  id: null,
  title: '5 Nights 6 Days Kashmir Tour Package',
  sub_title: "Shera Travels — Let's Travel The World",
  nights: 5,
  days: 6,
  start_location: 'Srinagar, Jammu & Kashmir',
  hero_photo_url: null,
  inclusions: ['MAP (Room + Breakfast + Dinner)', 'Sightseeing', 'Transfers', 'Pickup & Drop', 'Private Cab', 'Accommodation', 'Shikara Ride Dal Lake'],
  exclusions: ['Personal Activities', 'Honeymoon Special Services'],
  tc_payment: '20% Advance of total booking amount.\nAirfare/Transport fare to be paid in full at one time in advance.',
  tc_cancel: 'Upon cancellation, refund will be made after deducting the Retention Amount.\nRetention Amount varies as per days left before package start date.\nRefund within 15 working days.',
  tc_notes: '',
  company_name: 'Shera Travels',
  company_addr: 'Radio Colony, Srinagar, Lawaypora, Srinagar, Jammu and Kashmir 190017',
  company_email: 'sheratravels21@gmail.com',
  company_phone: '+91-9149406965, 9858966518',
  company_gst: '01KODPS7232P1ZE',
}

const initialState = {
  packages: [],
  currentPackage: null,
  prices: [],
  days: [],
  library: [],
  loading: false,
  saving: false,
  saveStatus: 'saved', // 'saved' | 'saving' | 'unsaved'
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PACKAGES': return { ...state, packages: action.payload }
    case 'SET_CURRENT_PACKAGE': return { ...state, currentPackage: action.payload }
    case 'UPDATE_PACKAGE_FIELD': return { ...state, currentPackage: { ...state.currentPackage, [action.field]: action.value } }
    case 'SET_PRICES': return { ...state, prices: action.payload }
    case 'SET_DAYS': return { ...state, days: action.payload }
    case 'SET_LIBRARY': return { ...state, library: action.payload }
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_SAVING': return { ...state, saving: action.payload, saveStatus: action.payload ? 'saving' : 'saved' }
    case 'SET_SAVE_STATUS': return { ...state, saveStatus: action.payload }
    default: return state
  }
}

export function PackageProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const saveTimerRef = useRef(null)

  // ── PACKAGES ──────────────────────────────
  const fetchPackages = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const { data, error } = await supabase.from('packages').select('*').order('created_at', { ascending: false })
    if (!error) dispatch({ type: 'SET_PACKAGES', payload: data || [] })
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  const loadPackage = useCallback(async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    const [pkgRes, pricesRes, daysRes] = await Promise.all([
      supabase.from('packages').select('*').eq('id', id).single(),
      supabase.from('prices').select('*').eq('package_id', id).order('sort_order'),
      supabase.from('days').select('*, day_photos(*)').eq('package_id', id).order('sort_order'),
    ])
    if (!pkgRes.error) dispatch({ type: 'SET_CURRENT_PACKAGE', payload: pkgRes.data })
    if (!pricesRes.error) dispatch({ type: 'SET_PRICES', payload: pricesRes.data || [] })
    if (!daysRes.error) dispatch({ type: 'SET_DAYS', payload: daysRes.data || [] })
    dispatch({ type: 'SET_LOADING', payload: false })
  }, [])

  const createNewPackage = useCallback(async () => {
    // Use saved company defaults if available
    const savedCompany = localStorage.getItem('company_defaults')
    const company = savedCompany ? JSON.parse(savedCompany) : {}

    const newPkg = {
      ...DEFAULT_PACKAGE,
      company_name: company.name || DEFAULT_PACKAGE.company_name,
      company_addr: company.addr || DEFAULT_PACKAGE.company_addr,
      company_email: company.email || DEFAULT_PACKAGE.company_email,
      company_phone: company.phone || DEFAULT_PACKAGE.company_phone,
      company_gst: company.gst || DEFAULT_PACKAGE.company_gst,
    }

    const pkgToInsert = { ...newPkg }
    delete pkgToInsert.id // Let DB generate UUID

    dispatch({ type: 'SET_SAVING', payload: true })
    const { data, error } = await supabase.from('packages').insert([pkgToInsert]).select().single()
    if (error) { toast.error('Failed to create package'); dispatch({ type: 'SET_SAVING', payload: false }); return null }

    // Use saved price templates if available
    const savedTemplates = localStorage.getItem('price_templates')
    const priceRows = savedTemplates
      ? JSON.parse(savedTemplates)
      : [
          { pax_type: 'Adult', age_limit: 'Above 12 years', price: 17500 },
          { pax_type: 'Child', age_limit: '5–12 years', price: 8000 },
        ]
    await supabase.from('prices').insert(
      priceRows.map((r, i) => ({ package_id: data.id, ...r, sort_order: i }))
    )

    dispatch({ type: 'SET_SAVING', payload: false })
    return data.id
  }, [])

  const deletePackage = useCallback(async (id) => {
    const { error } = await supabase.from('packages').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return false }
    toast.success('Package deleted')
    return true
  }, [])

  // ── AUTO-SAVE (debounced) ─────────────────
  const triggerSave = useCallback((pkg, prices, days) => {
    dispatch({ type: 'SET_SAVE_STATUS', payload: 'unsaved' })
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveAll(pkg, prices, days), 1000)
  }, []) // eslint-disable-line

  const saveAll = useCallback(async (pkg, prices, days) => {
    if (!pkg?.id) return
    dispatch({ type: 'SET_SAVING', payload: true })
    try {
      // Update package (exclude id from body)
      const { id: _, ...pkgUpdates } = pkg
      const { error: pkgErr } = await supabase.from('packages').update({ ...pkgUpdates, updated_at: new Date().toISOString() }).eq('id', pkg.id)
      if (pkgErr) throw pkgErr

      // Upsert prices
      await Promise.all(prices.map(async (p, i) => {
        const { id: pid, ...pData } = p
        const payload = { ...pData, sort_order: i, package_id: pkg.id }
        if (pid) {
          const { error } = await supabase.from('prices').update(payload).eq('id', pid)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('prices').insert([payload]).select().single()
          if (error) throw error
          if (data) p.id = data.id
        }
      }))

      // Upsert days
      await Promise.all(days.map(async (d, i) => {
        const { id: did, day_photos: _, _open: __, ...dData } = d
        const payload = { ...dData, sort_order: i, package_id: pkg.id }
        if (did) {
          const { error } = await supabase.from('days').update(payload).eq('id', did)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('days').insert([payload]).select().single()
          if (error) throw error
          if (data) d.id = data.id
        }
      }))
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' })
    } catch (e) {
      console.error('Save error:', e)
      toast.error('Save failed: ' + (e.message || 'Check database connection'))
    }
    dispatch({ type: 'SET_SAVING', payload: false })
  }, [])

  // ── PACKAGE FIELD UPDATE ──────────────────
  const updateField = useCallback((field, value) => {
    dispatch({ type: 'UPDATE_PACKAGE_FIELD', field, value })
  }, [])

  // ── PRICES ──────────────────────────────
  const addPrice = useCallback(() => {
    dispatch({ type: 'SET_PRICES', payload: [...state.prices, { id: null, pax_type: '', age_limit: '', price: '' }] })
  }, [state.prices])

  const addPricePreset = useCallback((preset) => {
    const exists = state.prices.some(p => p.pax_type === preset.pax_type)
    if (exists) return
    dispatch({ type: 'SET_PRICES', payload: [...state.prices, { id: null, pax_type: preset.pax_type, age_limit: preset.age_limit, price: preset.price }] })
  }, [state.prices])

  const updatePrice = useCallback((idx, field, value) => {
    const updated = [...state.prices]
    updated[idx] = { ...updated[idx], [field]: value }
    dispatch({ type: 'SET_PRICES', payload: updated })
  }, [state.prices])

  const removePrice = useCallback(async (idx) => {
    const p = state.prices[idx]
    if (p?.id) await supabase.from('prices').delete().eq('id', p.id)
    const updated = [...state.prices]
    updated.splice(idx, 1)
    dispatch({ type: 'SET_PRICES', payload: updated })
  }, [state.prices])

  // ── DAYS ──────────────────────────────
  const addDay = useCallback(() => {
    const n = state.days.length + 1
    const newDay = {
      id: null,
      package_id: state.currentPackage?.id,
      day_number: n,
      title: `Day ${n}: `,
      description: '',
      distance: '',
      hotspots: [],
      themes: [],
      meals: ['Stay', 'Breakfast', 'Dinner'],
      accommodation: '',
      accom_star: 3,
      hotel_photo_url: null,
      sort_order: n - 1,
      day_photos: [],
      _open: true,
    }
    dispatch({ type: 'SET_DAYS', payload: [...state.days, newDay] })
  }, [state.days, state.currentPackage])

  const removeDay = useCallback(async (idx) => {
    const day = state.days[idx]
    if (day?.id) await supabase.from('days').delete().eq('id', day.id)
    const updated = [...state.days]
    updated.splice(idx, 1)
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  const updateDay = useCallback((idx, field, value) => {
    const updated = [...state.days]
    updated[idx] = { ...updated[idx], [field]: value }
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  const toggleDayOpen = useCallback((idx) => {
    const updated = [...state.days]
    updated[idx] = { ...updated[idx], _open: !updated[idx]._open }
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  // ── PHOTO LIBRARY ─────────────────────
  const fetchLibrary = useCallback(async () => {
    const { data } = await supabase.from('photo_library').select('*').order('created_at', { ascending: false })
    dispatch({ type: 'SET_LIBRARY', payload: data || [] })
  }, [])

  const uploadToLibrary = useCallback(async (file, tagType, tagName) => {
    try {
      const url = await uploadPhoto(file, 'library')
      const { data, error } = await supabase.from('photo_library').insert([{
        photo_url: url, file_name: file.name, tag_type: tagType, tag_name: tagName || 'Unnamed'
      }]).select().single()
      if (error) throw error
      dispatch({ type: 'SET_LIBRARY', payload: [data, ...state.library] })
    } catch (e) {
      toast.error('Upload failed. Have you added Supabase credentials?')
    }
  }, [state.library])

  const deleteLibraryPhoto = useCallback(async (id, url) => {
    await deletePhoto(url)
    await supabase.from('photo_library').delete().eq('id', id)
    dispatch({ type: 'SET_LIBRARY', payload: state.library.filter(p => p.id !== id) })
  }, [state.library])

  // ── DAY PHOTOS ────────────────────────
  const setDayPhoto = useCallback(async (dayIdx, slotIdx, photo) => {
    const updated = [...state.days]
    const day = { ...updated[dayIdx] }
    const photos = [...(day.day_photos || [])]
    // Remove existing at slot
    const existing = photos.find(p => p.slot_index === slotIdx)
    if (existing?.id) {
      await supabase.from('day_photos').delete().eq('id', existing.id)
    }
    // Insert new
    let newPhoto = { ...photo, slot_index: slotIdx, day_id: day.id, id: null }
    if (day.id) {
      const { data, error } = await supabase.from('day_photos').insert([{
        day_id: day.id, 
        photo_url: photo.photo_url, 
        tag_name: photo.tag_name, 
        tag_type: photo.tag_type, 
        slot_index: slotIdx
      }]).select().single()
      if (error) {
        console.error('Photo insert error:', error)
        toast.error('Failed to save photo to DB')
      }
      if (data) newPhoto = data
    }
    const filtered = photos.filter(p => p.slot_index !== slotIdx)
    day.day_photos = [...filtered, newPhoto]
    updated[dayIdx] = day
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  const removeDayPhoto = useCallback(async (dayIdx, slotIdx) => {
    const updated = [...state.days]
    const day = { ...updated[dayIdx] }
    const photos = [...(day.day_photos || [])]
    const existing = photos.find(p => p.slot_index === slotIdx)
    if (existing?.id) await supabase.from('day_photos').delete().eq('id', existing.id)
    day.day_photos = photos.filter(p => p.slot_index !== slotIdx)
    updated[dayIdx] = day
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  const setHeroPhoto = useCallback(async (photo) => {
    dispatch({ type: 'UPDATE_PACKAGE_FIELD', field: 'hero_photo_url', value: photo.photo_url })
  }, [])

  const setHotelPhoto = useCallback(async (dayIdx, photo) => {
    const updated = [...state.days]
    updated[dayIdx] = { ...updated[dayIdx], hotel_photo_url: photo.photo_url }
    dispatch({ type: 'SET_DAYS', payload: updated })
  }, [state.days])

  return (
    <PackageContext.Provider value={{
      ...state,
      fetchPackages, loadPackage, createNewPackage, deletePackage,
      updateField, triggerSave, saveAll,
      addPrice, addPricePreset, updatePrice, removePrice,
      addDay, removeDay, updateDay, toggleDayOpen,
      fetchLibrary, uploadToLibrary, deleteLibraryPhoto,
      setDayPhoto, removeDayPhoto, setHeroPhoto, setHotelPhoto,
    }}>
      {children}
    </PackageContext.Provider>
  )
}

export const usePackage = () => useContext(PackageContext)
