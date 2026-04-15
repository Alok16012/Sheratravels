import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCRM, LEAD_STAGES, LEAD_SOURCES } from '../../context/CRMContext'
import CRMLayout from '../../components/crm/CRMLayout'

// ── Helpers ────────────────────────────────────────────────
const AVATAR_COLORS = ['#4F6EF7','#8B5CF6','#10B981','#F59E0B','#EF4444','#0EA5E9','#F97316','#14B8A6']
function avatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}
function daysAgo(dateStr) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1d ago'
  return `${d}d ago`
}

// ── Empty lead form ────────────────────────────────────────
const EMPTY_FORM = {
  name: '', phone: '', whatsapp: '', email: '',
  destination: '', travel_date: '', return_date: '',
  adults: 1, children: 0, infants: 0,
  budget_min: '', budget_max: '',
  source: 'WhatsApp', notes: '',
}

// ── Lead Card ──────────────────────────────────────────────
function LeadCard({ lead, onStageChange, onDelete }) {
  const [showStageSelect, setShowStageSelect] = useState(false)
  const pax = (lead.adults || 0) + (lead.children || 0) + (lead.infants || 0)
  const stage = LEAD_STAGES.find(s => s.id === lead.stage) || LEAD_STAGES[0]
  const waMsg = encodeURIComponent(`Hi ${lead.name}! Shera Travels here. Hope you're doing well! 😊`)
  const waLink = `https://wa.me/${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}?text=${waMsg}`

  return (
    <div
      className="crm-lead-card"
      style={{ '--card-color': stage.color, '--card-bg': stage.bg }}
    >
      {/* Left border color */}
      <style>{`.crm-lead-card::before { background: ${stage.color}; }`}</style>

      {/* Top row: Avatar + Name + Age */}
      <div className="crm-lc-top">
        <div className="crm-lc-avatar" style={{ background: avatarColor(lead.name) }}>
          {initials(lead.name)}
        </div>
        <div className="crm-lc-info">
          <div className="crm-lc-name">{lead.name}</div>
          <div className="crm-lc-phone">{lead.phone || lead.whatsapp || '—'}</div>
        </div>
        <div className="crm-lc-age">{daysAgo(lead.created_at)}</div>
      </div>

      {/* Destination */}
      {lead.destination && (
        <div className="crm-lc-dest">
          <span>📍</span>
          <span>{lead.destination}</span>
        </div>
      )}

      {/* Meta chips */}
      <div className="crm-lc-meta">
        {lead.travel_date && (
          <span className="crm-lc-chip">
            📅 {new Date(lead.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {pax > 0 && (
          <span className="crm-lc-chip">👤 {pax} pax</span>
        )}
        {(lead.budget_min || lead.budget_max) && (
          <span className="crm-lc-chip">
            💰 {lead.budget_min ? `₹${Number(lead.budget_min).toLocaleString('en-IN')}` : ''}
            {lead.budget_max ? `–₹${Number(lead.budget_max).toLocaleString('en-IN')}` : ''}
          </span>
        )}
        {lead.source && (
          <span className="crm-lc-chip">{lead.source}</span>
        )}
      </div>

      {/* Stage change dropdown */}
      <div style={{ marginTop: 8 }}>
        <select
          className="crm-stage-select"
          value={lead.stage}
          style={{ color: stage.color, borderColor: stage.color, background: stage.bg }}
          onChange={e => {
            e.stopPropagation()
            onStageChange(lead.id, e.target.value)
          }}
          onClick={e => e.stopPropagation()}
        >
          {LEAD_STAGES.map(s => (
            <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
          ))}
        </select>
      </div>

      {/* Action buttons */}
      <div className="crm-lc-actions">
        {(lead.phone || lead.whatsapp) && (
          <a
            className="crm-lc-action crm-lc-action-call"
            href={`tel:${lead.phone || lead.whatsapp}`}
            title="Call"
            onClick={e => e.stopPropagation()}
          >
            📞 Call
          </a>
        )}
        {(lead.whatsapp || lead.phone) && (
          <a
            className="crm-lc-action crm-lc-action-wa"
            href={waLink}
            target="_blank"
            rel="noreferrer"
            title="WhatsApp"
            onClick={e => e.stopPropagation()}
          >
            💬 WA
          </a>
        )}
        <button
          className="crm-lc-action crm-lc-action-view"
          title="Delete"
          onClick={e => {
            e.stopPropagation()
            if (window.confirm(`Delete lead "${lead.name}"?`)) onDelete(lead.id)
          }}
          style={{ flex: 'none', padding: '6px 8px', fontSize: 12, background: '#FEE2E2', color: '#EF4444' }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

// ── Add Lead Modal ─────────────────────────────────────────
function AddLeadModal({ onClose, onSave, saving }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="crm-modal-overlay" onClick={onClose}>
      <div className="crm-modal" onClick={e => e.stopPropagation()}>
        <div className="crm-modal-head">
          <div className="crm-modal-title">➕ New Lead Add Karo</div>
          <button className="crm-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="crm-modal-body">
            {/* Contact Info */}
            <div className="crm-form-section">Contact Details</div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Name *</label>
                <input className="crm-input" placeholder="Customer ka naam" value={form.name} required
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Phone</label>
                <input className="crm-input" placeholder="+91 98765 43210" value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">WhatsApp</label>
                <input className="crm-input" placeholder="+91 98765 43210" value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Email</label>
                <input className="crm-input" type="email" placeholder="email@example.com" value={form.email}
                  onChange={e => set('email', e.target.value)} />
              </div>
            </div>

            {/* Trip Info */}
            <div className="crm-form-section">Trip Details</div>
            <div className="crm-field">
              <label className="crm-label">Destination</label>
              <input className="crm-input" placeholder="e.g. Kashmir, Manali, Goa" value={form.destination}
                onChange={e => set('destination', e.target.value)} />
            </div>
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Travel Date</label>
                <input className="crm-input" type="date" value={form.travel_date}
                  onChange={e => set('travel_date', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Return Date</label>
                <input className="crm-input" type="date" value={form.return_date}
                  onChange={e => set('return_date', e.target.value)} />
              </div>
            </div>

            {/* Pax */}
            <div className="crm-grid-3">
              <div className="crm-field">
                <label className="crm-label">Adults</label>
                <input className="crm-input" type="number" min="0" value={form.adults}
                  onChange={e => set('adults', parseInt(e.target.value) || 0)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Children</label>
                <input className="crm-input" type="number" min="0" value={form.children}
                  onChange={e => set('children', parseInt(e.target.value) || 0)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Infants</label>
                <input className="crm-input" type="number" min="0" value={form.infants}
                  onChange={e => set('infants', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            {/* Budget */}
            <div className="crm-grid-2">
              <div className="crm-field">
                <label className="crm-label">Budget Min (₹)</label>
                <input className="crm-input" type="number" min="0" placeholder="15000" value={form.budget_min}
                  onChange={e => set('budget_min', e.target.value)} />
              </div>
              <div className="crm-field">
                <label className="crm-label">Budget Max (₹)</label>
                <input className="crm-input" type="number" min="0" placeholder="25000" value={form.budget_max}
                  onChange={e => set('budget_max', e.target.value)} />
              </div>
            </div>

            {/* Source */}
            <div className="crm-field">
              <label className="crm-label">Source</label>
              <select className="crm-select" value={form.source} onChange={e => set('source', e.target.value)}>
                {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="crm-field">
              <label className="crm-label">Notes</label>
              <textarea className="crm-textarea" rows={3}
                placeholder="Koi specific requirement, note, ya remark..."
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
              />
            </div>
          </div>

          <div className="crm-modal-footer">
            <button type="button" className="crm-btn crm-btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="crm-btn crm-btn-primary" disabled={saving}>
              {saving ? '⏳ Saving...' : '✓ Lead Save Karo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Leads Page ────────────────────────────────────────
export default function Leads() {
  const [searchParams] = useSearchParams()
  const { leads, loading, fetchLeads, createLead, changeStage, deleteLead, saving } = useCRM()

  const [search,    setSearch]    = useState('')
  const [srcFilter, setSrcFilter] = useState('')
  const [stgFilter, setStgFilter] = useState('')
  const [showAdd,   setShowAdd]   = useState(false)
  const [view,      setView]      = useState('table')   // 'kanban' | 'table'

  // Focus on highlighted stage from dashboard click
  const stageFilter = searchParams.get('stage') || stgFilter

  useEffect(() => { fetchLeads() }, [fetchLeads])

  // ── Filter leads ──────────────────────────────────────────
  const filtered = leads.filter(lead => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      lead.name?.toLowerCase().includes(q) ||
      lead.phone?.includes(q) ||
      lead.whatsapp?.includes(q) ||
      lead.destination?.toLowerCase().includes(q)
    const matchSrc = !srcFilter || lead.source === srcFilter
    return matchSearch && matchSrc
  })

  // ── Group by stage ────────────────────────────────────────
  const byStage = LEAD_STAGES.reduce((acc, s) => {
    acc[s.id] = filtered.filter(l => l.stage === s.id)
    return acc
  }, {})

  const handleSave = async (formData) => {
    await createLead(formData)
    setShowAdd(false)
  }

  return (
    <CRMLayout>
      {/* ── PAGE HEADER ── */}
      <div className="crm-page-header">
        <div>
          <div className="crm-page-title">Leads Pipeline</div>
          <div className="crm-page-sub">
            {leads.length} total leads — {leads.filter(l => !['completed','lost'].includes(l.stage)).length} active
          </div>
        </div>
        <div className="crm-page-actions">
          <button className="crm-btn crm-btn-primary" onClick={() => setShowAdd(true)}>
            ＋ New Lead
          </button>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="crm-filter-bar">
        <div className="crm-search-wrap">
          <span className="crm-search-icon">🔍</span>
          <input
            className="crm-search-input"
            placeholder="Search name, phone, destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="crm-filter-select" value={srcFilter} onChange={e => setSrcFilter(e.target.value)}>
          <option value="">All Sources</option>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="crm-filter-select" value={stgFilter} onChange={e => setStgFilter(e.target.value)}>
          <option value="">All Stages</option>
          {LEAD_STAGES.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
        </select>
        {(search || srcFilter || stgFilter) && (
          <button className="crm-btn crm-btn-ghost crm-btn-sm"
            onClick={() => { setSearch(''); setSrcFilter(''); setStgFilter('') }}>
            ✕ Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
          {filtered.length} leads
        </span>
        {/* ── View toggle ── */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3, gap: 2 }}>
          <button
            onClick={() => setView('table')}
            style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700,
              background: view === 'table' ? '#fff' : 'transparent',
              color: view === 'table' ? '#4F6EF7' : '#94A3B8',
              boxShadow: view === 'table' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            ☰ Table
          </button>
          <button
            onClick={() => setView('kanban')}
            style={{
              padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 700,
              background: view === 'kanban' ? '#fff' : 'transparent',
              color: view === 'kanban' ? '#4F6EF7' : '#94A3B8',
              boxShadow: view === 'kanban' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            ⠿ Kanban
          </button>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading && leads.length === 0 ? (
        <div className="crm-loading"><div className="crm-spinner" /><p style={{ fontSize: 14 }}>Loading leads…</p></div>
      ) : view === 'table' ? (

        /* ══ TABLE VIEW ══ */
        filtered.length === 0 ? (
          <div className="crm-card">
            <div className="crm-empty">
              <div className="crm-empty-icon">👥</div>
              <h3>Koi lead nahi mila</h3>
              <p>Filter change karo ya naya lead add karo</p>
              <button className="crm-btn crm-btn-primary" style={{ marginTop: 14 }} onClick={() => setShowAdd(true)}>
                ＋ First Lead Add Karo
              </button>
            </div>
          </div>
        ) : (
          <div className="crm-table-card">
            <table className="crm-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: 200 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 140 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 60 }}  />
                <col style={{ width: 140 }} />
                <col style={{ width: 160 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Destination</th>
                  <th>Travel Date</th>
                  <th>Pax</th>
                  <th>Budget</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const stage = LEAD_STAGES.find(s => s.id === lead.stage) || LEAD_STAGES[0]
                  const pax = (lead.adults || 0) + (lead.children || 0) + (lead.infants || 0)
                  const waMsg = encodeURIComponent(`Hi ${lead.name}! Shera Travels here. Hope you're doing well! 😊`)
                  const waLink = `https://wa.me/${(lead.whatsapp || lead.phone || '').replace(/\D/g, '')}?text=${waMsg}`
                  return (
                    <tr key={lead.id}>
                      {/* Customer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            background: avatarColor(lead.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#fff',
                          }}>
                            {initials(lead.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{lead.name}</div>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{daysAgo(lead.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      {/* Phone */}
                      <td style={{ fontSize: 12, color: '#334155' }}>
                        {lead.phone || lead.whatsapp || '—'}
                      </td>
                      {/* Destination */}
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {lead.destination || '—'}
                        </div>
                      </td>
                      {/* Travel Date */}
                      <td style={{ fontSize: 12, color: '#334155' }}>
                        {lead.travel_date
                          ? new Date(lead.travel_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                      {/* Pax */}
                      <td style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                        {pax || '—'}
                      </td>
                      {/* Budget */}
                      <td style={{ fontSize: 12, color: '#334155' }}>
                        {lead.budget_min || lead.budget_max
                          ? `${lead.budget_min ? '₹'+Number(lead.budget_min).toLocaleString('en-IN') : ''}${lead.budget_max ? '–₹'+Number(lead.budget_max).toLocaleString('en-IN') : ''}`
                          : '—'}
                      </td>
                      {/* Stage dropdown */}
                      <td>
                        <select
                          value={lead.stage}
                          style={{
                            border: `1.5px solid ${stage.color}`,
                            background: stage.bg,
                            color: stage.color,
                            borderRadius: 6,
                            padding: '4px 6px',
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: 'Inter,sans-serif',
                            cursor: 'pointer',
                            width: '100%',
                          }}
                          onChange={e => changeStage(lead.id, e.target.value)}
                        >
                          {LEAD_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                          ))}
                        </select>
                      </td>
                      {/* Source */}
                      <td>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#64748B',
                          background: '#F1F5F9', borderRadius: 5,
                          padding: '3px 7px', whiteSpace: 'nowrap',
                        }}>
                          {lead.source || '—'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {(lead.phone || lead.whatsapp) && (
                            <a href={`tel:${lead.phone || lead.whatsapp}`}
                              className="crm-action-btn" style={{ background: '#EEF2FF', color: '#4F6EF7', textDecoration: 'none' }}
                              title="Call">📞</a>
                          )}
                          {(lead.whatsapp || lead.phone) && (
                            <a href={waLink} target="_blank" rel="noreferrer"
                              className="crm-action-btn" style={{ background: '#ECFDF5', color: '#10B981', textDecoration: 'none' }}
                              title="WhatsApp">💬</a>
                          )}
                          <button
                            className="crm-action-btn"
                            style={{ background: '#FEE2E2', color: '#EF4444' }}
                            title="Delete"
                            onClick={() => window.confirm(`Delete "${lead.name}"?`) && deleteLead(lead.id)}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )

      ) : (

        /* ══ KANBAN VIEW ══ */
        <div className="crm-kanban-wrap">
          <div className="crm-kanban">
            {LEAD_STAGES.map(stage => {
              const stageLeads = byStage[stage.id] || []
              return (
                <div
                  key={stage.id}
                  className="crm-kanban-col"
                  style={stageFilter === stage.id ? { outline: `2px solid ${stage.color}`, borderRadius: 16 } : {}}
                >
                  <div className="crm-kanban-col-head">
                    <div className="crm-kanban-col-indicator" style={{ background: stage.color }} />
                    <div className="crm-kanban-col-label">{stage.emoji} {stage.label}</div>
                    <div className="crm-kanban-col-count"
                      style={stageLeads.length > 0 ? { background: stage.bg, color: stage.color } : {}}>
                      {stageLeads.length}
                    </div>
                  </div>
                  <div className="crm-kanban-cards">
                    {stageLeads.length === 0 ? (
                      <div className="crm-kanban-empty">
                        <div className="crm-kanban-empty-icon">•••</div>
                        <div>No leads</div>
                      </div>
                    ) : (
                      stageLeads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} onStageChange={changeStage} onDelete={deleteLead} />
                      ))
                    )}
                    {stage.id === 'new_inquiry' && (
                      <button onClick={() => setShowAdd(true)}
                        style={{
                          width: '100%', padding: '10px',
                          border: `1.5px dashed ${stage.color}40`, borderRadius: 10,
                          background: 'transparent', color: '#94A3B8',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.target.style.background = stage.bg; e.target.style.color = stage.color }}
                        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#94A3B8' }}
                      >+ Add Lead</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ADD LEAD MODAL ── */}
      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </CRMLayout>
  )
}
