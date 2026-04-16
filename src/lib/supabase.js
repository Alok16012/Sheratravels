import { createClient } from '@supabase/supabase-js'

// Read from localStorage first (set via Admin page), fall back to env vars
const storedUrl = localStorage.getItem('sb_url')
const storedKey = localStorage.getItem('sb_key')

const supabaseUrl = (storedUrl && storedUrl.startsWith('https://')) ? storedUrl : import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = (storedKey && storedKey.length > 20) ? storedKey : import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if credentials are configured
const isConfigured = !!(
  supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  !supabaseUrl.includes('your_supabase_project_url_here') &&
  supabaseAnonKey && 
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('your_supabase_anon_key_here')
)

// Create client only if configured; otherwise use a mock
let supabase

if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  console.warn('⚠️ Supabase credentials not configured. Using localStorage fallback.')
  supabase = createMockClient()
}

function createMockClient() {
  const store = {
    packages:     JSON.parse(localStorage.getItem('mock_packages')     || '[]'),
    prices:       JSON.parse(localStorage.getItem('mock_prices')       || '[]'),
    days:         JSON.parse(localStorage.getItem('mock_days')         || '[]'),
    day_photos:   JSON.parse(localStorage.getItem('mock_day_photos')   || '[]'),
    photo_library:JSON.parse(localStorage.getItem('mock_photo_library')|| '[]'),
    leads:        JSON.parse(localStorage.getItem('crm_leads')         || '[]'),
    lead_notes:   JSON.parse(localStorage.getItem('crm_notes')         || '[]'),
    bookings:     JSON.parse(localStorage.getItem('crm_bookings')      || '[]'),
    payments:     JSON.parse(localStorage.getItem('crm_payments')      || '[]'),
  }

  const persist = (table) => {
    const key = ['leads','lead_notes','bookings','payments'].includes(table)
      ? `crm_${table === 'lead_notes' ? 'notes' : table}`
      : `mock_${table}`
    localStorage.setItem(key, JSON.stringify(store[table]))
  }

  const makeBuilder = (table) => {
    let _filters = []
    let _order = null
    let _single = false
    let _op = 'select'
    let _data = null

    const execute = () => {
      let rows = store[table] ? [...store[table]] : []
      if (_filters.length) {
        rows = rows.filter(r => _filters.every(f => String(r[f.col]) === String(f.val)))
      }
      if (_order) rows = rows.sort((a, b) => String(a[_order.col]).localeCompare(String(b[_order.col])))

      if (_op === 'select') {
        return _single ? { data: rows[0] || null, error: null } : { data: rows, error: null }
      }
      if (_op === 'insert') {
        const added = _data.map(d => ({ ...d, id: d.id || crypto.randomUUID(), created_at: new Date().toISOString() }))
        store[table] = [...(store[table] || []), ...added]
        persist(table)
        return _single ? { data: added[0], error: null } : { data: added, error: null }
      }
      if (_op === 'update') {
        store[table] = (store[table] || []).map(r =>
          _filters.every(f => String(r[f.col]) === String(f.val)) ? { ...r, ..._data } : r
        )
        persist(table)
        const updated = (store[table] || []).filter(r => _filters.every(f => String(r[f.col]) === String(f.val)))
        return _single ? { data: updated[0] || null, error: null } : { data: updated, error: null }
      }
      if (_op === 'delete') {
        store[table] = (store[table] || []).filter(r => !_filters.every(f => String(r[f.col]) === String(f.val)))
        persist(table)
        return { data: null, error: null }
      }
      return { data: null, error: null }
    }

    const builder = {
      select: () => builder,
      insert: (rows) => { _op = 'insert'; _data = Array.isArray(rows) ? rows : [rows]; return builder },
      update: (data) => { _op = 'update'; _data = data; return builder },
      delete: () => { _op = 'delete'; return builder },
      eq:     (col, val) => { _filters.push({ col, val }); return builder },
      order:  (col, opts) => { _order = { col, opts }; return builder },
      limit:  () => builder,
      single: () => { _single = true; return builder },
      then: (resolve, reject) => Promise.resolve(execute()).then(resolve, reject),
      catch: (reject) => Promise.resolve(execute()).catch(reject),
    }
    return builder
  }

  return {
    from: (table) => makeBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ data: {}, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: {}, error: null }),
      })
    }
  }
}

export { supabase, isConfigured }

// ── Credential helpers (used by Admin page) ────────────────────────────────
export function saveCredentials(url, key) {
  localStorage.setItem('sb_url', url.trim())
  localStorage.setItem('sb_key', key.trim())
}

export function clearCredentials() {
  localStorage.removeItem('sb_url')
  localStorage.removeItem('sb_key')
}

export function getStoredCredentials() {
  return {
    url: localStorage.getItem('sb_url') || '',
    key: localStorage.getItem('sb_key') || '',
  }
}

// ── Helper: Upload image file to Supabase Storage and return public URL ────
export async function uploadPhoto(file, folder = 'library') {
  if (!isConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(file)
    })
  }
  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
  const { data, error } = await supabase.storage
    .from('itinerary-photos')
    .upload(fileName, file, { upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('itinerary-photos').getPublicUrl(fileName)
  return urlData.publicUrl
}

// ── Helper: Delete photo from storage ─────────────────────────────────────
export async function deletePhoto(url) {
  if (!isConfigured) return
  try {
    const path = url.split('/itinerary-photos/')[1]
    if (path) await supabase.storage.from('itinerary-photos').remove([path])
  } catch (e) {
    console.warn('Could not delete photo from storage:', e)
  }
}
