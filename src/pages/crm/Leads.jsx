import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCRM, LEAD_STAGES } from '../../context/CRMContext'
import toast from 'react-hot-toast'

// ── Helpers ────────────────────────────────────────────────
const avatarColor = (name = '') => {
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9']
  return colors[(name.charCodeAt(0) || 0) % colors.length]
}

const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

// ── Lead Detail Modal ──────────────────────────────────────
function LeadModal({ lead, onSave, onClose }) {
  const [form, setForm] = useState(lead || { 
    name: '', email: '', phone: '', whatsapp: '',
    destination: '', travel_date: '', stage: 'new',
    adults: 1, children: 0, infants: 0, 
    source: 'Website', notes: ''
  })

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '540px', padding: '32px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{lead ? 'Edit' : 'Add New'} Lead</h3>
          <button style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-dim)', cursor: 'pointer' }} onClick={onClose}>&times;</button>
        </div>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Name</label>
            <input className="glass-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Traveler Name" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone / WhatsApp</label>
            <input className="glass-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 ..." />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Destination</label>
            <input className="glass-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="e.g. Kashmir, Maldives" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Travel Date</label>
            <input className="glass-input" type="date" value={form.travel_date} onChange={e => setForm({...form, travel_date: e.target.value})} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stage</label>
            <select className="glass-input" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
              {LEAD_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Notes</label>
            <textarea className="glass-input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Shared requirements..." />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}

export default function Leads() {
  const { leads, loading, fetchLeads, addLead, updateLead, deleteLead } = useCRM()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editingLead, setEditingLead] = useState(null)

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase()
    const matchesSearch = l.name?.toLowerCase().includes(q) || l.destination?.toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || l.stage === filter
    return matchesSearch && matchesFilter
  })

  const stats = [
    { label: 'All Leads', count: leads.length, color: '#6366f1' },
    { label: 'New', count: leads.filter(l => l.stage === 'new').length, color: '#f59e0b' },
    { label: 'Negotiating', count: leads.filter(l => l.stage === 'negotiating').length, color: '#3b82f6' },
    { label: 'Booked', count: leads.filter(l => l.stage === 'booked').length, color: '#10b981' },
  ]

  const handleSave = async (formData) => {
    if (editingLead) {
      await updateLead(editingLead.id, formData)
      toast.success('Lead updated')
    } else {
      await addLead(formData)
      toast.success('Lead added successfully')
    }
    setEditingLead(null)
    setShowAdd(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      await deleteLead(id)
      toast.success('Lead removed')
    }
  }

  return (
    <div className="leads-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient">Traveler Pipeline</h1>
          <p className="text-muted">Tracking {leads.length} active inquiries</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <span>+</span> New Inquiry
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-card animate-fade" style={{ 
            padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '160px', animationDelay: `${i * 0.1}s` 
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: '18px', fontWeights: '800' }}>{s.count}</span>
          </div>
        ))}
      </div>

      <div className="glass-card animate-fade" style={{ padding: 0, overflow: 'hidden', animationDelay: '0.4s' }}>
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', gap: '24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ flex: 1, maxWidth: '320px' }}>
            <input className="glass-input" placeholder="Search travelers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px' }}>
            <button 
              className={`btn btn-ghost ${filter === 'all' ? 'btn-primary' : ''}`} 
              style={{ padding: '8px 16px', fontSize: '12px' }}
              onClick={() => setFilter('all')}
            >All</button>
            {LEAD_STAGES.map(s => (
              <button 
                key={s.id} 
                className={`btn btn-ghost ${filter === s.id ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', fontSize: '12px' }}
                onClick={() => setFilter(s.id)}
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
                <th>Traveler</th>
                <th>Destination</th>
                <th>Trip Date</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        background: avatarColor(lead.name), display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', 
                        fontWeight: '800', fontSize: '12px', color: '#fff' 
                      }}>
                        {initials(lead.name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: '700', fontSize: '14px' }}>{lead.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{lead.phone || 'No contact'}</p>
                      </div>
                    </div>
                  </td>
                  <td>{lead.destination || '—'}</td>
                  <td>{lead.travel_date ? new Date(lead.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '11px', 
                      fontWeight: '800', textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.05)', color: LEAD_STAGES.find(s => s.id === lead.stage)?.color
                    }}>
                      {LEAD_STAGES.find(s => s.id === lead.stage)?.label || lead.stage}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost" style={{ padding: '8px', fontSize: '16px' }} onClick={() => setEditingLead(lead)}>✏️</button>
                      <button className="btn btn-ghost" style={{ padding: '8px', fontSize: '16px', color: '#ef4444' }} onClick={() => handleDelete(lead.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAdd || editingLead) && (
        <LeadModal 
          lead={editingLead} 
          onSave={handleSave} 
          onClose={() => { setShowAdd(false); setEditingLead(null); }} 
        />
      )}
    </div>
  )
}
