import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import Topbar from '../components/Topbar'
import { saveCredentials, clearCredentials, getStoredCredentials, isConfigured } from '../lib/supabase'

const DEFAULT_COMPANY = {
  name: 'Shera Travels',
  addr: 'Budgam, Jammu & Kashmir, India',
  email: 'sheratravels21@gmail.com',
  phone: '+91-9149406965, 9858966518',
}

const DEFAULT_PRICE_TEMPLATES = [
  { pax_type: 'Adult', age_limit: 'Above 12 years', price: 17500 },
  { pax_type: 'Child', age_limit: '5–12 years', price: 8000 },
  { pax_type: 'Infant', age_limit: 'Below 5 years', price: 0 },
]

export default function Admin() {
  const navigate = useNavigate()

  // Supabase section
  const [sbUrl, setSbUrl] = useState('')
  const [sbKey, setSbKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState(isConfigured)

  // Company section
  const [company, setCompany] = useState(DEFAULT_COMPANY)

  // Price templates section
  const [templates, setTemplates] = useState(DEFAULT_PRICE_TEMPLATES)

  useEffect(() => {
    const creds = getStoredCredentials()
    setSbUrl(creds.url)
    setSbKey(creds.key)

    const savedCompany = localStorage.getItem('company_defaults')
    if (savedCompany) setCompany(JSON.parse(savedCompany))

    const savedTemplates = localStorage.getItem('price_templates')
    if (savedTemplates) setTemplates(JSON.parse(savedTemplates))
  }, [])

  const handleTestConnect = async () => {
    if (!sbUrl || !sbKey) { toast.error('URL aur API Key dono bharo'); return }
    if (!sbUrl.startsWith('https://')) { toast.error('URL https:// se start honi chahiye'); return }
    setTesting(true)
    try {
      const testClient = createClient(sbUrl.trim(), sbKey.trim())
      const { error } = await testClient.from('packages').select('id').limit(1)
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw error
      saveCredentials(sbUrl.trim(), sbKey.trim())
      setConnected(true)
      toast.success('Connected! App reload ho raha hai...')
      setTimeout(() => { window.location.href = '/' }, 1800)
    } catch (e) {
      toast.error('Connection fail: ' + (e.message || 'Credentials check karo'))
      setConnected(false)
    }
    setTesting(false)
  }

  const handleDisconnect = () => {
    if (!window.confirm('Supabase se disconnect karo? App local storage use karegi.')) return
    clearCredentials()
    setConnected(false)
    setSbUrl('')
    setSbKey('')
    toast.success('Disconnected. Local storage mode.')
    setTimeout(() => window.location.reload(), 1000)
  }

  const saveCompany = () => {
    localStorage.setItem('company_defaults', JSON.stringify(company))
    toast.success('Company info save ho gayi!')
  }

  const saveTemplates = () => {
    localStorage.setItem('price_templates', JSON.stringify(templates))
    toast.success('Price templates save ho gaye!')
  }

  const addTemplateRow = () => {
    setTemplates([...templates, { pax_type: '', age_limit: '', price: 0 }])
  }

  const updateTemplate = (i, field, value) => {
    const updated = [...templates]
    updated[i] = { ...updated[i], [field]: value }
    setTemplates(updated)
  }

  const removeTemplate = (i) => {
    setTemplates(templates.filter((_, idx) => idx !== i))
  }

  return (
    <>
      <Topbar mode="admin" />
      <div className="admin-page">

        {/* ── PAGE HEADER ── */}
        <div className="admin-page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Wapas
          </button>
          <div>
            <h1 className="admin-title">⚙️ Admin Settings</h1>
            <p className="admin-sub">Database connect karo, company info aur default prices set karo</p>
          </div>
        </div>

        {/* ── SUPABASE CONNECTION ── */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-icon">🗄️</div>
            <div style={{ flex: 1 }}>
              <div className="admin-card-title">Supabase Database</div>
              <div className="admin-card-desc">Cloud database se connect karo — sab data cloud mein save hoga</div>
            </div>
            <div className={`conn-badge ${connected ? 'conn-ok' : 'conn-off'}`}>
              <span className="conn-dot" />
              {connected ? 'Connected' : 'Offline Mode'}
            </div>
          </div>

          {connected ? (
            <div className="admin-connected-info">
              <div className="conn-url-display">
                <span>🔗</span>
                <span className="conn-url-text">{sbUrl || 'Supabase connected'}</span>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="admin-form">
              <div className="admin-tip" style={{ borderLeft: '4px solid #F59E0B', background: '#FFFBEB', color: '#92400E' }}>
                <strong>⚠️ IMPORTANT:</strong> Pehle <code>supabase-schema.sql</code> (project root mein) ko Supabase SQL Editor mein run karo.
                <br />Uss file mein <strong>"disable row level security"</strong> wali lines hona zaroori hai, warna save nahi hoga!
              </div>
              <div className="admin-form-grid">
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Project URL</label>
                  <input
                    type="url"
                    placeholder="https://xxxxxxxxxxxx.supabase.co"
                    value={sbUrl}
                    onChange={e => setSbUrl(e.target.value)}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Anon / Public Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={e => setSbKey(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={handleTestConnect}
                disabled={testing}
              >
                {testing ? '⏳ Testing...' : '🔌 Test & Connect'}
              </button>
            </div>
          )}
        </div>

        {/* ── COMPANY DEFAULTS ── */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-icon">🏢</div>
            <div>
              <div className="admin-card-title">Company Info</div>
              <div className="admin-card-desc">Har naye package mein yeh info automatically bharo</div>
            </div>
          </div>
          <div className="admin-form">
            <div className="admin-form-grid">
              <div className="field">
                <label>Company Name</label>
                <input
                  value={company.name}
                  placeholder="Shera Travels"
                  onChange={e => setCompany({ ...company, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Phone</label>
                <input
                  value={company.phone}
                  placeholder="+91-XXXXXXXXXX"
                  onChange={e => setCompany({ ...company, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Email</label>
                <input
                  value={company.email}
                  placeholder="info@example.com"
                  onChange={e => setCompany({ ...company, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Address</label>
                <input
                  value={company.addr}
                  placeholder="City, State, India"
                  onChange={e => setCompany({ ...company, addr: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-success" onClick={saveCompany}>
              ✓ Company Info Save Karo
            </button>
          </div>
        </div>

        {/* ── DEFAULT PRICE TEMPLATES ── */}
        <div className="admin-card">
          <div className="admin-card-head">
            <div className="admin-card-icon">💰</div>
            <div>
              <div className="admin-card-title">Default Price Rates</div>
              <div className="admin-card-desc">Naya package banane par yeh prices automatically add honge</div>
            </div>
          </div>
          <div className="admin-form">
            <table className="price-table">
              <thead>
                <tr>
                  <th>Pax Type</th>
                  <th>Age Limit</th>
                  <th>Price (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={row.pax_type}
                        placeholder="Adult"
                        onChange={e => updateTemplate(i, 'pax_type', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        value={row.age_limit}
                        placeholder="Above 12 years"
                        onChange={e => updateTemplate(i, 'age_limit', e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="price-input-wrap">
                        <span className="price-rupee">₹</span>
                        <input
                          type="number"
                          value={row.price}
                          placeholder="17500"
                          min="0"
                          onChange={e => updateTemplate(i, 'price', Number(e.target.value))}
                        />
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => removeTemplate(i)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="admin-template-actions">
              <button className="btn btn-ghost btn-sm" onClick={addTemplateRow}>+ Row Add Karo</button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setTemplates(DEFAULT_PRICE_TEMPLATES)}
              >
                ↺ Reset
              </button>
              <button className="btn btn-success" onClick={saveTemplates}>
                ✓ Templates Save Karo
              </button>
            </div>
          </div>
        </div>

        {/* ── QUICK LINKS ── */}
        <div className="admin-card admin-card-links">
          <div className="admin-card-head">
            <div className="admin-card-icon">🔗</div>
            <div>
              <div className="admin-card-title">Quick Links</div>
              <div className="admin-card-desc">Useful resources</div>
            </div>
          </div>
          <div className="admin-links-grid">
            <a className="admin-link-item" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
              <span className="admin-link-icon">🗄️</span>
              <span>Supabase Dashboard</span>
              <span className="admin-link-arrow">→</span>
            </a>
            <div className="admin-link-item" style={{ cursor: 'default', opacity: 0.6 }}>
              <span className="admin-link-icon">📄</span>
              <span>supabase-schema.sql (project root)</span>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
