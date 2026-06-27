import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePackage } from '../context/PackageContext'
import { useCRM } from '../context/CRMContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Itinerary() {
  const navigate = useNavigate()
  const { packages, fetchPackages, createNewPackage, loading } = usePackage()
  const { leads, fetchLeads } = useCRM()
  const [clientMap, setClientMap] = useState({})

  useEffect(() => {
    fetchPackages()
    fetchLeads()
  }, [fetchPackages, fetchLeads])

  // Deduplicate packages by title
  const uniquePackages = packages.reduce((acc, pkg) => {
    const existing = acc.find(p => (p.title || 'Untitled') === (pkg.title || 'Untitled'))
    if (!existing) acc.push(pkg)
    return acc
  }, [])

  useEffect(() => {
    // Initialize clientMap from packages
    const map = {}
    packages.forEach(p => {
      if (p.client_name) map[p.id] = p.client_name
    })
    setClientMap(map)
  }, [packages])

  const handleClientChange = async (pkgId, clientName) => {
    setClientMap(prev => ({ ...prev, [pkgId]: clientName }))
    const { error } = await supabase
      .from('packages')
      .update({ client_name: clientName })
      .eq('id', pkgId)
    if (error) {
      toast.error('Failed to save client')
    } else {
      toast.success('Client assigned')
    }
  }

  const handleNew = async () => {
    const id = await createNewPackage()
    if (id) navigate(`/editor/${id}`)
  }

  const handleDelete = async (pkgId) => {
    if (!confirm('Delete this itinerary?')) return
    const { error } = await supabase.from('packages').delete().eq('id', pkgId)
    if (error) {
      toast.error('Failed to delete')
    } else {
      toast.success('Deleted')
      fetchPackages()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-bright)', marginBottom: 4 }}>Itineraries</h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>{uniquePackages.length} packages created</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <span>+</span> New Itinerary
        </button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /></div>
      ) : uniquePackages.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h2>No itineraries yet</h2>
          <p>Create your first travel itinerary</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleNew}>+ Create Itinerary</button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table itin-excel-table">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Duration</th>
                  <th>Location</th>
                  <th>Client</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {uniquePackages.map(pkg => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#fff' }}>
                          📋
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{pkg.title || 'Untitled'}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{pkg.nights}N / {pkg.days}D</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{pkg.start_location || 'Kashmir'}</td>
                    <td>
                      <select
                        className="glass-input"
                        style={{ padding: '6px 10px', fontSize: 12.5, minWidth: 150 }}
                        value={clientMap[pkg.id] || ''}
                        onChange={e => handleClientChange(pkg.id, e.target.value)}
                      >
                        <option value="">— No Client —</option>
                        {leads.map(lead => (
                          <option key={lead.id} value={lead.name}>{lead.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => navigate(`/editor/${pkg.id}`)}>✏️</button>
                        <button className="btn btn-ghost" style={{ padding: 8, color: '#EF4444' }} onClick={() => handleDelete(pkg.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
