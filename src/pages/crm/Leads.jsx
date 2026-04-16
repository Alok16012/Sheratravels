import { useState, useEffect } from 'react'
import { useCRM, LEAD_STAGES } from '../../context/CRMContext'
import toast from 'react-hot-toast'

const avatarColor = (name = '') => {
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9']
  return colors[(name.charCodeAt(0) || 0) % colors.length]
}

const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

function LeadModal({ lead, onSave, onClose }) {
  const [form, setForm] = useState(lead || { 
    name: '', email: '', phone: '', whatsapp: '',
    destination: '', travel_date: '', stage: 'new_inquiry',
    adults: 1, children: 0, infants: 0, 
    source: 'Website', notes: ''
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card animate-fade" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{lead ? 'Edit Lead' : 'Add New Lead'}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body-custom">
          <div className="form-row">
            <div className="form-field">
              <label>Full Name</label>
              <input className="glass-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Traveler Name" />
            </div>
            <div className="form-field">
              <label>Phone / WhatsApp</label>
              <input className="glass-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+91 ..." />
            </div>
          </div>
          
          <div className="form-field">
            <label>Destination</label>
            <input className="glass-input" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} placeholder="e.g. Kashmir, Maldives" />
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label>Travel Date</label>
              <input className="glass-input" type="date" value={form.travel_date} onChange={e => setForm({...form, travel_date: e.target.value})} />
            </div>
            <div className="form-field">
              <label>Stage</label>
              <select className="glass-input" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                {LEAD_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          
          <div className="form-field">
            <label>Notes</label>
            <textarea className="glass-input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Shared requirements..." />
          </div>
        </div>
        
        <div className="modal-footer-custom">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(form)}>Save Lead</button>
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
    { label: 'Total', count: leads.length, color: '#6366f1' },
    { label: 'New', count: leads.filter(l => l.stage === 'new_inquiry').length, color: '#f59e0b' },
    { label: 'Negotiating', count: leads.filter(l => ['negotiation', 'negotiating'].includes(l.stage)).length, color: '#3b82f6' },
    { label: 'Booked', count: leads.filter(l => ['advance_paid', 'documents', 'booked'].includes(l.stage)).length, color: '#10b981' },
  ]

  const handleSave = async (formData) => {
    if (!formData.name?.trim()) {
      toast.error('Name is required')
      return
    }
    
    try {
      if (editingLead) {
        await updateLead(editingLead.id, formData)
      } else {
        await addLead(formData)
      }
      // Force refetch to ensure data is synced
      await fetchLeads()
    } catch (err) {
      console.error('Save error:', err)
    }
    setEditingLead(null)
    setShowAdd(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this lead?')) {
      await deleteLead(id)
      toast.success('Lead removed')
    }
  }

  return (
    <div className="leads-dashboard">
      <div className="leads-header">
        <div>
          <h1 className="text-gradient">Traveler Pipeline</h1>
          <p className="text-muted">{leads.length} inquiries</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + New Lead
        </button>
      </div>

      <div className="stats-row">
        {stats.map((s, i) => (
          <div key={i} className="stat-chip glass-card animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="stat-dot" style={{ background: s.color }} />
            <div className="stat-info">
              <span className="stat-count">{s.count}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-row">
        <input className="glass-input search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="filter-pills">
          <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
          {LEAD_STAGES.slice(0, 5).map(s => (
            <button key={s.id} className={`filter-pill ${filter === s.id ? 'active' : ''}`} onClick={() => setFilter(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card leads-table-card">
        <div className="leads-list">
          {filteredLeads.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <h3>No leads found</h3>
              <p>Add your first lead to get started</p>
            </div>
          ) : filteredLeads.map(lead => (
            <div key={lead.id} className="lead-item">
              <div className="lead-avatar" style={{ background: avatarColor(lead.name) }}>
                {initials(lead.name)}
              </div>
              <div className="lead-info">
                <p className="lead-name">{lead.name}</p>
                <p className="lead-meta">{lead.destination || 'No destination'} • {lead.phone || 'No phone'}</p>
              </div>
              <div className="lead-stage">
                <span className="stage-badge" style={{ color: LEAD_STAGES.find(s => s.id === lead.stage)?.color }}>
                  {LEAD_STAGES.find(s => s.id === lead.stage)?.emoji} {LEAD_STAGES.find(s => s.id === lead.stage)?.label || lead.stage}
                </span>
              </div>
              <div className="lead-actions">
                <button className="action-btn" onClick={() => setEditingLead(lead)}>✏️</button>
                <button className="action-btn delete" onClick={() => handleDelete(lead.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(showAdd || editingLead) && (
        <LeadModal 
          lead={editingLead} 
          onSave={handleSave} 
          onClose={() => { setShowAdd(false); setEditingLead(null); }} 
        />
      )}

      <style jsx>{`
        .leads-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
          gap: 16px;
        }
        .leads-header h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .leads-header .btn { white-space: nowrap; }
        
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .stat-chip {
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .stat-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .stat-info {
          display: flex;
          flex-direction: column;
        }
        .stat-count {
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }
        .stat-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
        }
        
        .filter-row {
          margin-bottom: 20px;
        }
        .search-input {
          max-width: 300px;
          margin-bottom: 12px;
        }
        .filter-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-pill {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-pill:hover {
          border-color: var(--primary);
          color: var(--primary);
        }
        .filter-pill.active {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        
        .leads-table-card {
          padding: 0;
          overflow: hidden;
        }
        .leads-list {
          display: flex;
          flex-direction: column;
        }
        .lead-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-glass);
          transition: background 0.15s;
        }
        .lead-item:last-child {
          border-bottom: none;
        }
        .lead-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .lead-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          flex-shrink: 0;
        }
        .lead-info {
          flex: 1;
          min-width: 0;
        }
        .lead-name {
          font-weight: 700;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .lead-meta {
          font-size: 12px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lead-stage {
          flex-shrink: 0;
        }
        .stage-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 20px;
          white-space: nowrap;
        }
        .lead-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.03);
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: scale(1.05);
        }
        .action-btn.delete:hover {
          background: rgba(239,68,68,0.2);
          border-color: #ef4444;
        }
        
        .empty-state {
          padding: 48px 20px;
          text-align: center;
        }
        .empty-state-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-state h3 { font-size: 18px; margin-bottom: 6px; }
        .empty-state p { color: var(--text-dim); }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-content {
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-glass);
        }
        .modal-header h3 { font-size: 18px; font-weight: 800; }
        .modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 14px;
        }
        .modal-close-btn:hover {
          background: rgba(239,68,68,0.2);
          color: #ef4444;
        }
        .modal-body-custom {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-field label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .modal-footer-custom {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.02);
        }
        
        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .leads-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .leads-header h1 { font-size: 22px; }
          .leads-header .btn { width: 100%; justify-content: center; }
          
          .stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .stat-chip { padding: 12px; }
          .stat-count { font-size: 18px; }
          .stat-label { font-size: 10px; }
          
          .filter-pills {
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }
          .filter-pill { white-space: nowrap; }
          
          .lead-item {
            padding: 14px 16px;
            gap: 12px;
          }
          .lead-avatar {
            width: 40px;
            height: 40px;
            font-size: 13px;
          }
          .lead-name { font-size: 14px; }
          .lead-meta { font-size: 11px; }
          .stage-badge { font-size: 10px; padding: 3px 8px; }
          .action-btn { width: 32px; height: 32px; font-size: 12px; }
          
          .modal-content { max-height: 95vh; }
          .modal-header { padding: 16px 20px; }
          .modal-header h3 { font-size: 16px; }
          .modal-body-custom { padding: 16px 20px; }
          .modal-footer-custom { padding: 12px 20px; }
        }
        @media (max-width: 480px) {
          .form-row { grid-template-columns: 1fr; }
          .lead-stage { display: none; }
          .lead-info { flex: 1; }
        }
      `}</style>
    </div>
  )
}
