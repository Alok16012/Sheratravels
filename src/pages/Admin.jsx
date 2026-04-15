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
    if (!sbUrl || !sbKey) { toast.error('URL aur API Key fill karo'); return }
    setTesting(true)
    try {
      const testClient = createClient(sbUrl.trim(), sbKey.trim())
      const { error } = await testClient.from('packages').select('id').limit(1)
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') throw error
      saveCredentials(sbUrl.trim(), sbKey.trim())
      setConnected(true)
      toast.success('Connected! Reloading app...')
      setTimeout(() => { window.location.href = '/' }, 1500)
    } catch (e) {
      toast.error('Connection fail: ' + (e.message || 'Check credentials'))
      setConnected(false)
    }
    setTesting(false)
  }

  const handleDisconnect = () => {
    if (!window.confirm('Disconnect from Supabase?')) return
    clearCredentials()
    setConnected(false)
    setSbUrl('')
    setSbKey('')
    toast.success('Disconnected.')
    setTimeout(() => window.location.reload(), 1000)
  }

  const saveCompany = () => {
    localStorage.setItem('company_defaults', JSON.stringify(company))
    toast.success('Company info saved!')
  }

  const saveTemplates = () => {
    localStorage.setItem('price_templates', JSON.stringify(templates))
    toast.success('Price templates saved!')
  }

  return (
    <div className="page-content">
      <div className="dashboard-header">
        <div>
          <h1 className="text-gradient">Settings & Admin</h1>
          <p className="text-muted">Configure your workspace defaults and database connection.</p>
        </div>
      </div>

      <div className="admin-sections-grid">
        {/* Supabase Connection */}
        <section className="glass-card settings-card">
          <div className="settings-head">
             <div className="settings-icon">🗄️</div>
             <div>
               <h3>Supabase Database</h3>
               <p className="text-dim">Connect your cloud database for real-time sync.</p>
             </div>
             <div className={`status-pill ${connected ? 'saved' : 'unsaved'}`}>
               {connected ? 'Connected' : 'Disconnected'}
             </div>
          </div>

          <div className="settings-form">
            <div className="form-field">
              <label>Project URL</label>
              <input 
                className="glass-input" 
                placeholder="https://xxx.supabase.co" 
                value={sbUrl}
                onChange={e => setSbUrl(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>API Key (Anon)</label>
              <input 
                className="glass-input" 
                type="password"
                placeholder="eyJhbGciOiJIUzI1Ni..." 
                value={sbKey}
                onChange={e => setSbKey(e.target.value)}
              />
            </div>
            <div className="form-actions">
              {connected ? (
                <button className="btn btn-ghost" onClick={handleDisconnect}>Disconnect</button>
              ) : (
                <button className="btn btn-primary" onClick={handleTestConnect} disabled={testing}>
                  {testing ? 'Testing...' : 'Connect Cloud'}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Company Info */}
        <section className="glass-card settings-card">
          <div className="settings-head">
             <div className="settings-icon">🏢</div>
             <div>
               <h3>Company Profile</h3>
               <p className="text-dim">Your brand details for itineraries.</p>
             </div>
          </div>

          <div className="settings-form split">
            <div className="form-field">
              <label>Name</label>
              <input className="glass-input" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input className="glass-input" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} />
            </div>
            <div className="form-field full">
              <label>Address</label>
              <input className="glass-input" value={company.addr} onChange={e => setCompany({...company, addr: e.target.value})} />
            </div>
            <div className="form-actions full">
              <button className="btn btn-primary" onClick={saveCompany}>Save Company Info</button>
            </div>
          </div>
        </section>

        {/* Price Templates */}
        <section className="glass-card settings-card full-width">
           <div className="settings-head">
             <div className="settings-icon">💰</div>
             <div>
               <h3>Default Price Templates</h3>
               <p className="text-dim">Pre-fill package pricing for faster creation.</p>
             </div>
          </div>
          
          <div className="settings-table-wrap">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Passenger Type</th>
                  <th>Age Limit</th>
                  <th>Base Price (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t, i) => (
                  <tr key={i}>
                    <td><input className="table-inline-input" value={t.pax_type} onChange={e => {
                      const up = [...templates]; up[i].pax_type = e.target.value; setTemplates(up);
                    }} /></td>
                    <td><input className="table-inline-input" value={t.age_limit} onChange={e => {
                      const up = [...templates]; up[i].age_limit = e.target.value; setTemplates(up);
                    }} /></td>
                    <td><input className="table-inline-input" type="number" value={t.price} onChange={e => {
                      const up = [...templates]; up[i].price = Number(e.target.value); setTemplates(up);
                    }} /></td>
                    <td><button className="icon-btn" onClick={() => setTemplates(templates.filter((_, idx) => idx !== i))}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="form-actions-row">
              <button className="btn btn-ghost" onClick={() => setTemplates([...templates, {pax_type:'', age_limit:'', price:0}])}>+ Add Row</button>
              <button className="btn btn-primary" onClick={saveTemplates}>Save Pricing Templates</button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .admin-sections-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        @media (max-width: 1024px) {
          .admin-sections-grid { grid-template-columns: 1fr; }
        }

        .settings-card { padding: 32px; }

        .settings-head {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 32px;
        }

        .settings-icon {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          font-size: 24px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .settings-form.split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-field { display: flex; flex-direction: column; gap: 8px; }
        .form-field label { font-size: 13px; font-weight: 700; color: var(--text-muted); }
        .full { grid-column: 1 / -1; }

        .form-actions { margin-top: 12px; }
        .form-actions-row { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-glass); }

        .table-inline-input {
          background: none;
          border: none;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          width: 100%;
          outline: none;
          padding: 8px 0;
        }

        .status-pill {
           margin-left: auto;
           padding: 4px 12px;
           border-radius: 20px;
           font-size: 11px;
           font-weight: 700;
           background: rgba(255, 255, 255, 0.05);
        }
        .status-pill.saved { color: #10b981; }
        .status-pill.unsaved { color: #f59e0b; }
      `}</style>
    </div>
  )
}
