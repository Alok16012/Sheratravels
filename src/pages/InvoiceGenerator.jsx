import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import logoUrl from '../../public/logo.png'

const COMPANY = {
  name: 'Shera Travels',
  tagline: "Let's Travel The World",
  phone1: '+91 91494 06965',
  phone2: '+91 98589 66518',
  email: 'info@sheratravels.com',
  address: 'Radio Colony Lawaypora, Srinagar, Jammu & Kashmir – 190017',
  gst: '01KODPS7232P1ZE',
}

const GST_STATE_CODES = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu', '27': 'Maharashtra', '28': 'Andhra Pradesh',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman and Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
  '38': 'Ladakh',
}

const ITEM_PRESETS = ['Tour Package', 'Hotel Accommodation', 'Cab / Transport', 'Houseboat Stay', 'Other Services']

function newItem(description = '') {
  return { id: crypto.randomUUID(), description, hsn: '', qty: 1, rate: '', discount: '', cgst: '', sgst: '', igst: '' }
}

function computeItem(item) {
  const qty = Number(item.qty) || 0
  const rate = Number(item.rate) || 0
  const discount = Number(item.discount) || 0
  const taxable = Math.max(0, qty * rate - discount)
  const cgstAmt = taxable * (Number(item.cgst) || 0) / 100
  const sgstAmt = taxable * (Number(item.sgst) || 0) / 100
  const igstAmt = taxable * (Number(item.igst) || 0) / 100
  return { taxable, cgstAmt, sgstAmt, igstAmt, total: taxable + cgstAmt + sgstAmt + igstAmt }
}

const fmt = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function InvoiceGenerator() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('unpaid')
  const [notes, setNotes] = useState('Advance payment is non-refundable. Balance due before trip start date.')

  const [client, setClient] = useState({ name: '', gstin: '', phone: '', address: '', stateCode: '' })
  const [items, setItems] = useState([newItem('Tour Package')])

  useEffect(() => {
    if (!id) {
      supabase.from('invoices').select('id').then(({ data }) => {
        const next = (data?.length || 0) + 1
        setInvoiceNumber(`INV-${new Date().getFullYear()}-${String(next).padStart(4, '0')}`)
      })
      return
    }
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single()
      if (error || !data) {
        toast.error('Invoice not found')
        navigate('/invoices')
        return
      }
      setInvoiceNumber(data.invoice_number || '')
      setIssueDate(data.issue_date || new Date().toISOString().slice(0, 10))
      setDueDate(data.due_date || '')
      setStatus(data.status || 'unpaid')
      setNotes(data.notes || '')
      setClient({
        name: data.client_name || '',
        gstin: data.client_gstin || '',
        phone: data.client_phone || '',
        address: data.client_address || '',
        stateCode: data.client_state_code || '',
      })
      setItems(Array.isArray(data.items) && data.items.length ? data.items : [newItem()])
      setLoading(false)
    }
    load()
  }, [id, navigate])

  const handleGstinChange = (value) => {
    const upper = value.toUpperCase()
    const code = upper.slice(0, 2)
    setClient(c => ({ ...c, gstin: upper, stateCode: GST_STATE_CODES[code] ? code : c.stateCode }))
  }

  const updateItem = (itemId, changes) => {
    setItems(list => list.map(it => it.id === itemId ? { ...it, ...changes } : it))
  }
  const removeItem = (itemId) => setItems(list => list.filter(it => it.id !== itemId))
  const addItem = (description = '') => setItems(list => [...list, newItem(description)])

  const computed = items.map(it => ({ ...it, ...computeItem(it) }))
  const subtotal = computed.reduce((s, it) => s + it.taxable, 0)
  const taxAmount = computed.reduce((s, it) => s + it.cgstAmt + it.sgstAmt + it.igstAmt, 0)
  const grandTotal = subtotal + taxAmount

  const saveAndDownload = async () => {
    if (!client.name.trim()) {
      toast.error('Client / company name is required')
      return
    }
    setSaving(true)
    const toastId = toast.loading('Saving invoice...')
    try {
      const payload = {
        invoice_number: invoiceNumber,
        client_name: client.name.trim(),
        client_gstin: client.gstin || null,
        client_phone: client.phone || null,
        client_address: client.address || null,
        client_state_code: client.stateCode || null,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        status,
        notes,
        items,
        subtotal,
        tax_amount: taxAmount,
        amount: grandTotal,
      }
      if (id) {
        const { error } = await supabase.from('invoices').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('invoices').insert([payload]).select().single()
        if (error) throw error
        navigate(`/invoices/${data.id}/edit`, { replace: true })
      }
      toast.dismiss(toastId)
      toast.success('Invoice saved')
    } catch (err) {
      toast.dismiss(toastId)
      toast.error(`Save failed: ${err.message || 'check RLS/schema'}`)
      console.error('Save invoice error:', err)
      setSaving(false)
      return
    }

    const genToastId = toast.loading('Generating PDF...')
    try {
      const el = document.getElementById('invoice-preview')
      const canvas = await html2canvas(el, { useCORS: true, scale: 2, logging: false, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const imgW = pageW
      const imgH = (canvas.height * pageW) / canvas.width
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, imgH)
      pdf.save(`${invoiceNumber || 'Invoice'} - ${client.name}.pdf`)
      toast.dismiss(genToastId)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.dismiss(genToastId)
      toast.error('Could not generate PDF. Try Print → Save as PDF instead.')
      console.error('PDF generation error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading-state"><div className="spinner" /></div>
  }

  return (
    <div className="invoice-gen">
      <div className="ig-header">
        <div>
          <Link to="/invoices" className="ig-back">← Back to Invoices</Link>
          <h1 className="text-gradient">Invoice Generator</h1>
        </div>
        <button className="btn btn-primary" onClick={saveAndDownload} disabled={saving}>
          {saving ? 'Working...' : '💾 Save & Download PDF'}
        </button>
      </div>

      <div className="ig-grid">
        {/* ── EDIT PANEL ───────────────────────────────── */}
        <div className="ig-edit">
          <div className="glass-card ig-card">
            <h3>Bill To</h3>
            <div className="form-field">
              <label>Client / Company Name</label>
              <input className="glass-input" value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} placeholder="Traveler / Company Name" />
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Client GSTIN</label>
                <input className="glass-input" value={client.gstin} onChange={e => handleGstinChange(e.target.value)} placeholder="Auto-fills state" />
              </div>
              <div className="form-field">
                <label>State</label>
                <input className="glass-input" value={GST_STATE_CODES[client.stateCode] || ''} readOnly placeholder="From GSTIN" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Phone</label>
                <input className="glass-input" value={client.phone} onChange={e => setClient(c => ({ ...c, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
              <div className="form-field">
                <label>Address</label>
                <input className="glass-input" value={client.address} onChange={e => setClient(c => ({ ...c, address: e.target.value }))} placeholder="City, State" />
              </div>
            </div>
          </div>

          <div className="glass-card ig-card">
            <h3>Invoice Details</h3>
            <div className="form-row">
              <div className="form-field">
                <label>Invoice No.</label>
                <input className="glass-input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Status</label>
                <select className="glass-input" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Issue Date</label>
                <input className="glass-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Due Date</label>
                <input className="glass-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass-card ig-card">
            <div className="ig-items-head">
              <h3>Line Items</h3>
              <div className="ig-presets">
                {ITEM_PRESETS.map(p => (
                  <button key={p} className="btn btn-ghost ig-preset-btn" onClick={() => addItem(p)}>+ {p}</button>
                ))}
              </div>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="ig-item-row">
                <div className="ig-item-row-head">
                  <span className="ig-item-num">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button className="ig-item-remove" onClick={() => removeItem(item.id)}>✕ Remove</button>
                  )}
                </div>
                <div className="form-field">
                  <label>Description</label>
                  <input className="glass-input" value={item.description} onChange={e => updateItem(item.id, { description: e.target.value })} placeholder="e.g. 5N/6D Kashmir Tour Package" />
                </div>
                <div className="ig-item-grid">
                  <div className="form-field">
                    <label>HSN/SAC</label>
                    <input className="glass-input" value={item.hsn} onChange={e => updateItem(item.id, { hsn: e.target.value })} placeholder="998552" />
                  </div>
                  <div className="form-field">
                    <label>Qty</label>
                    <input className="glass-input" type="number" value={item.qty} onChange={e => updateItem(item.id, { qty: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Rate (₹)</label>
                    <input className="glass-input" type="number" value={item.rate} onChange={e => updateItem(item.id, { rate: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>Discount (₹)</label>
                    <input className="glass-input" type="number" value={item.discount} onChange={e => updateItem(item.id, { discount: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>CGST %</label>
                    <input className="glass-input" type="number" value={item.cgst} onChange={e => updateItem(item.id, { cgst: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>SGST %</label>
                    <input className="glass-input" type="number" value={item.sgst} onChange={e => updateItem(item.id, { sgst: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label>IGST %</label>
                    <input className="glass-input" type="number" value={item.igst} onChange={e => updateItem(item.id, { igst: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => addItem()}>+ Add Line Item</button>
          </div>

          <div className="glass-card ig-card">
            <h3>Notes / Terms</h3>
            <textarea className="glass-input" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Payment terms, cancellation policy, bank details..." />
          </div>
        </div>

        {/* ── PREVIEW PANEL ───────────────────────────────── */}
        <div className="ig-preview-wrap">
          <div id="invoice-preview" className="ig-preview">
            <div className="ig-pv-header">
              <div className="ig-pv-brand-block">
                <div className="ig-pv-brand">
                  <img src={logoUrl} alt="Shera Travels" className="ig-pv-logo" />
                  <div>
                    <h1>{COMPANY.name}</h1>
                    <p className="ig-pv-tagline">{COMPANY.tagline}</p>
                  </div>
                </div>
                <div className="ig-pv-contact-list">
                  <p><strong>Address:</strong> {COMPANY.address}</p>
                  <p><strong>Phone:</strong> {COMPANY.phone1}, {COMPANY.phone2}</p>
                  <p><strong>Email:</strong> {COMPANY.email}</p>
                  <p><strong>GSTIN:</strong> {COMPANY.gst}</p>
                </div>
              </div>
              <div className="ig-pv-header-right">
                <div className="ig-pv-badge">TAX INVOICE</div>
                <div className="ig-pv-meta-list">
                  <p><span>Invoice No:</span> <strong>{invoiceNumber || '—'}</strong></p>
                  <p><span>Date:</span> <strong>{issueDate ? new Date(issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</strong></p>
                  {dueDate && (
                    <p><span>Due Date:</span> <strong>{new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></p>
                  )}
                </div>
              </div>
            </div>

            <div className="ig-pv-billto">
              <div className="ig-pv-label">Bill To</div>
              <div className="ig-pv-bill-name">{client.name || 'Client Name'}</div>
              {client.address && <div>{client.address}</div>}
              {client.phone && <div>Ph: {client.phone}</div>}
              {client.gstin && <div>GSTIN: {client.gstin}{GST_STATE_CODES[client.stateCode] ? ` (${GST_STATE_CODES[client.stateCode]})` : ''}</div>}
            </div>

            <table className="ig-pv-table">
              <thead>
                <tr>
                  <th>Sn</th>
                  <th>Description</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Disc.</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((it, i) => (
                  <tr key={it.id}>
                    <td>{i + 1}</td>
                    <td>{it.description || '—'}</td>
                    <td>{it.hsn || '—'}</td>
                    <td>{it.qty || 0}</td>
                    <td>{fmt(it.rate)}</td>
                    <td>{fmt(it.discount)}</td>
                    <td>{fmt(it.cgstAmt)}</td>
                    <td>{fmt(it.sgstAmt)}</td>
                    <td>{fmt(it.igstAmt)}</td>
                    <td>{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ig-pv-totals">
              <div className="ig-pv-totals-row"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="ig-pv-totals-row"><span>Total Tax</span><span>{fmt(taxAmount)}</span></div>
              <div className="ig-pv-totals-row ig-pv-grand"><span>Grand Total</span><span>{fmt(grandTotal)}</span></div>
            </div>

            {notes && (
              <div className="ig-pv-notes">
                <div className="ig-pv-label">Notes</div>
                <p>{notes}</p>
              </div>
            )}

            <div className="ig-pv-footer">
              <p className="ig-pv-footer-gst">GSTIN: {COMPANY.gst} &nbsp;|&nbsp; {COMPANY.email} &nbsp;|&nbsp; {COMPANY.phone1}</p>
              <p>{COMPANY.name} — {COMPANY.tagline}</p>
              <p>This is a system-generated invoice.</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ig-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 20px;
          gap: 16px;
        }
        .ig-back { font-size: 12.5px; font-weight: 700; color: var(--text-muted); text-decoration: none; display: inline-block; margin-bottom: 6px; }
        .ig-back:hover { color: var(--primary); }
        .ig-header h1 { font-size: 26px; font-weight: 800; }

        .ig-grid {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 20px;
          align-items: start;
        }

        .ig-edit { display: flex; flex-direction: column; gap: 16px; }
        .ig-card { padding: 20px; }
        .ig-card h3 { font-size: 14px; font-weight: 800; margin-bottom: 14px; }
        .ig-card .form-field { margin-bottom: 12px; }
        .ig-card .form-field:last-child { margin-bottom: 0; }
        .ig-card .form-row { margin-bottom: 12px; }
        .ig-card textarea.glass-input { resize: vertical; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

        .ig-items-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .ig-items-head h3 { margin-bottom: 0; }
        .ig-presets { display: flex; flex-wrap: wrap; gap: 6px; }
        .ig-preset-btn { font-size: 11px; padding: 5px 10px; }

        .ig-item-row {
          border: 1px solid var(--border-glass);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 12px;
          background: #F8FAFC;
        }
        .ig-item-row-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .ig-item-num { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .ig-item-remove { border: none; background: none; color: #ef4444; font-size: 11px; font-weight: 700; cursor: pointer; }
        .ig-item-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 10px; }

        .ig-preview-wrap { position: sticky; top: 20px; }
        .ig-preview {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          padding: 36px;
          color: #1a1a1a;
          display: flex;
          flex-direction: column;
          min-height: 1050px;
        }
        .ig-pv-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #E2E8F0;
        }
        .ig-pv-brand-block { display: flex; flex-direction: column; gap: 14px; }
        .ig-pv-brand { display: flex; align-items: center; gap: 14px; }
        .ig-pv-logo { width: 60px; height: 60px; object-fit: contain; flex-shrink: 0; }
        .ig-pv-brand h1 { font-size: 26px; font-weight: 900; letter-spacing: 0.4px; color: #0EA5E9; text-transform: uppercase; }
        .ig-pv-tagline { font-size: 12px; font-style: italic; color: #64748B; margin-top: 2px; }
        .ig-pv-contact-list { font-size: 11.5px; color: #475569; line-height: 1.9; }
        .ig-pv-contact-list p { margin: 0; }
        .ig-pv-contact-list strong { color: #1a1a1a; font-weight: 700; }
        .ig-pv-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 16px; flex-shrink: 0; }
        .ig-pv-badge {
          background: #0EA5E9;
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          padding: 12px 26px;
          border-radius: 8px;
          letter-spacing: 1.5px;
          white-space: nowrap;
        }
        .ig-pv-meta-list { text-align: right; font-size: 12px; color: #475569; line-height: 2; }
        .ig-pv-meta-list p { margin: 0; }
        .ig-pv-meta-list span { color: #94A3B8; margin-right: 6px; }
        .ig-pv-meta-list strong { color: #1a1a1a; font-weight: 700; }
        .ig-pv-billto {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 18px;
          font-size: 12.5px;
          line-height: 1.6;
        }
        .ig-pv-bill-name { font-size: 14px; font-weight: 800; margin-bottom: 2px; }
        .ig-pv-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94A3B8; letter-spacing: 0.4px; margin-bottom: 2px; }

        .ig-pv-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
        .ig-pv-table th {
          background: #0F172A;
          color: #fff;
          text-align: left;
          padding: 8px 8px;
          font-weight: 700;
          white-space: nowrap;
        }
        .ig-pv-table td {
          padding: 8px 8px;
          border-bottom: 1px solid #E2E8F0;
          white-space: nowrap;
        }
        .ig-pv-table td:nth-child(2) { white-space: normal; min-width: 140px; }

        .ig-pv-totals { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; margin-bottom: 20px; }
        .ig-pv-totals-row { display: flex; justify-content: space-between; gap: 40px; font-size: 12.5px; width: 240px; }
        .ig-pv-grand { font-size: 16px; font-weight: 800; border-top: 2px solid #0F172A; padding-top: 8px; margin-top: 4px; color: #0EA5E9; }

        .ig-pv-notes { font-size: 11.5px; color: #475569; margin-bottom: 16px; }
        .ig-pv-notes p { margin-top: 4px; white-space: pre-wrap; }

        .ig-pv-footer { margin-top: auto; padding-top: 14px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 10.5px; color: #94A3B8; }
        .ig-pv-footer-gst { font-weight: 700; color: #1a1a1a; font-size: 11px; margin-bottom: 4px; }

        @media (max-width: 1100px) {
          .ig-grid { grid-template-columns: 1fr; }
          .ig-preview-wrap { position: static; }
        }
        @media (max-width: 768px) {
          .ig-header { flex-direction: column; align-items: flex-start; }
          .ig-header .btn { width: 100%; justify-content: center; }
          .ig-item-grid { grid-template-columns: 1fr 1fr; }
          .ig-preview { padding: 18px; min-height: 0; }
          .ig-pv-logo { width: 40px; height: 40px; }
          .ig-pv-brand { gap: 8px; }
          .ig-pv-brand h1 { font-size: 16px; }
          .ig-pv-tagline { font-size: 9px; }
          .ig-pv-contact-list { font-size: 9.5px; line-height: 1.7; }
          .ig-pv-badge { font-size: 10px; padding: 6px 10px; letter-spacing: 0.8px; }
          .ig-pv-meta-list { font-size: 10px; }
        }
      `}</style>
    </div>
  )
}
