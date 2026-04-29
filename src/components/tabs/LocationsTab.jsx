import { useState } from 'react'
import { usePackage } from '../../context/PackageContext'
import {
  STATES, getDistricts, getBlocks, getGPs, getVillages
} from '../../data/jk-locations'

const EMPTY = { state: '', district: '', block: '', gram_panchayat: '', village: '' }

function CascadeSelect({ label, value, options, onChange, placeholder, allowCustom = true }) {
  const [custom, setCustom] = useState(false)
  const showCustom = custom || (value && !options.includes(value) && value !== '')

  return (
    <div className="cascade-field">
      <label>{label}</label>
      {showCustom ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="glass-input"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={`Type ${label}...`}
          />
          {options.length > 0 && (
            <button
              className="cascade-toggle"
              onClick={() => { setCustom(false); onChange('') }}
              title="Back to list"
            >↩</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <select
            className="glass-input"
            value={value}
            onChange={e => {
              if (e.target.value === '__custom__') { setCustom(true); onChange('') }
              else onChange(e.target.value)
            }}
            disabled={options.length === 0}
          >
            <option value="">{options.length === 0 ? '— Select above first —' : placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
            {allowCustom && <option value="__custom__">✏️ Type manually...</option>}
          </select>
        </div>
      )}
    </div>
  )
}

function LocationRow({ loc, onChange, onRemove }) {
  const districts = getDistricts(loc.state)
  const blocks     = getBlocks(loc.district)
  const gps        = getGPs(loc.block)
  const villages   = getVillages(loc.gram_panchayat)

  const set = (field, val) => {
    const updated = { ...loc, [field]: val }
    // Reset downstream when upstream changes
    if (field === 'state')           { updated.district = ''; updated.block = ''; updated.gram_panchayat = ''; updated.village = '' }
    if (field === 'district')        { updated.block = ''; updated.gram_panchayat = ''; updated.village = '' }
    if (field === 'block')           { updated.gram_panchayat = ''; updated.village = '' }
    if (field === 'gram_panchayat')  { updated.village = '' }
    onChange(updated)
  }

  const levelsDone = [loc.state, loc.district, loc.block, loc.gram_panchayat, loc.village].filter(Boolean).length

  return (
    <div className="location-row glass-card">
      <div className="location-row-header">
        <div className="location-breadcrumb">
          {loc.state && <span className="bc-chip">{loc.state}</span>}
          {loc.district && <><span className="bc-sep">›</span><span className="bc-chip">{loc.district}</span></>}
          {loc.block && <><span className="bc-sep">›</span><span className="bc-chip">{loc.block}</span></>}
          {loc.gram_panchayat && <><span className="bc-sep">›</span><span className="bc-chip bc-gp">{loc.gram_panchayat}</span></>}
          {loc.village && <><span className="bc-sep">›</span><span className="bc-chip bc-village">{loc.village}</span></>}
          {!loc.state && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select location below</span>}
        </div>
        <button className="location-remove" onClick={onRemove} title="Remove">✕</button>
      </div>

      <div className="location-progress">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`progress-dot ${levelsDone >= i ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="cascade-grid">
        <CascadeSelect
          label="State / UT"
          value={loc.state}
          options={STATES}
          onChange={v => set('state', v)}
          placeholder="— Select State —"
          allowCustom={false}
        />
        <CascadeSelect
          label="District"
          value={loc.district}
          options={districts}
          onChange={v => set('district', v)}
          placeholder="— Select District —"
        />
        <CascadeSelect
          label="Block / Tehsil"
          value={loc.block}
          options={blocks}
          onChange={v => set('block', v)}
          placeholder="— Select Block —"
        />
        <CascadeSelect
          label="Gram Panchayat"
          value={loc.gram_panchayat}
          options={gps}
          onChange={v => set('gram_panchayat', v)}
          placeholder="— Select GP —"
        />
        <CascadeSelect
          label="Village / Spot"
          value={loc.village}
          options={villages}
          onChange={v => set('village', v)}
          placeholder="— Select Village —"
        />
      </div>
    </div>
  )
}

export default function LocationsTab({ active }) {
  const { currentPackage: pkg, updateField } = usePackage()
  if (!pkg) return null

  const locations = Array.isArray(pkg.locations) ? pkg.locations : []

  const addLocation = () => {
    updateField('locations', [...locations, { ...EMPTY, id: Date.now() }])
  }

  const updateLocation = (idx, updated) => {
    const next = [...locations]
    next[idx] = updated
    updateField('locations', next)
  }

  const removeLocation = (idx) => {
    updateField('locations', locations.filter((_, i) => i !== idx))
  }

  const fullyFilled = locations.filter(l => l.state && l.district && l.block && l.gram_panchayat && l.village)

  return (
    <div className={`tab-panel ${active ? 'active' : ''}`}>
      <div className="section-head">Tour Locations</div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
        Add all the places this tour visits. Each location follows the hierarchy:<br />
        <strong>State → District → Block/Tehsil → Gram Panchayat → Village</strong>
      </p>

      {locations.length === 0 && (
        <div className="locations-empty">
          <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
          <p>No locations added yet.</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click below to add tour destinations.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {locations.map((loc, idx) => (
          <LocationRow
            key={loc.id || idx}
            loc={loc}
            onChange={updated => updateLocation(idx, updated)}
            onRemove={() => removeLocation(idx)}
          />
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={addLocation}>
        + Add Location
      </button>

      {fullyFilled.length > 0 && (
        <div className="locations-summary glass-card" style={{ marginTop: 20 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>Locations Summary</div>
          {fullyFilled.map((l, i) => (
            <div key={i} className="summary-loc-item">
              <span className="summary-num">{i + 1}</span>
              <span className="summary-text">
                {l.village} <span style={{ color: 'var(--text-muted)' }}>— {l.gram_panchayat}, {l.block}, {l.district}, {l.state}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .location-row {
          padding: 16px;
          border-radius: 12px;
        }
        .location-row-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          gap: 8px;
        }
        .location-breadcrumb {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .bc-chip {
          font-size: 11px;
          font-weight: 700;
          background: rgba(99,102,241,0.12);
          color: var(--primary);
          padding: 2px 8px;
          border-radius: 20px;
        }
        .bc-gp     { background: rgba(16,185,129,0.12); color: #10b981; }
        .bc-village{ background: rgba(245,158,11,0.12); color: #f59e0b; }
        .bc-sep    { color: var(--text-muted); font-size: 12px; }
        .location-remove {
          width: 26px; height: 26px;
          border-radius: 6px;
          border: 1px solid var(--border-glass);
          background: rgba(239,68,68,0.08);
          color: #ef4444;
          cursor: pointer;
          font-size: 12px;
          flex-shrink: 0;
        }
        .location-remove:hover { background: rgba(239,68,68,0.2); }

        .location-progress {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
        }
        .progress-dot {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.08);
          transition: background 0.3s;
        }
        .progress-dot.filled { background: var(--primary); }

        .cascade-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .cascade-field label {
          font-size: 10px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.6px;
          display: block;
          margin-bottom: 5px;
        }
        .cascade-toggle {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid var(--border-glass);
          background: rgba(255,255,255,0.05);
          color: var(--text-dim);
          cursor: pointer;
          font-size: 16px;
          flex-shrink: 0;
        }

        .locations-empty {
          text-align: center;
          padding: 32px 16px;
          color: var(--text-dim);
        }

        .locations-summary {
          padding: 16px;
          border-radius: 12px;
        }
        .summary-loc-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-glass);
          font-size: 13px;
        }
        .summary-loc-item:last-child { border-bottom: none; }
        .summary-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .summary-text { line-height: 1.5; }
      `}</style>
    </div>
  )
}
