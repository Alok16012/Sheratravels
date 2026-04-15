import { useState } from 'react'
import { usePackage } from '../context/PackageContext'

const MEALS = ['Stay', 'Breakfast', 'Lunch', 'Dinner']

export default function DayCard({ day, idx }) {
  const { updateDay, removeDay, toggleDayOpen, library, setDayPhoto, removeDayPhoto, setHotelPhoto } = usePackage()
  const [pickerTarget, setPickerTarget] = useState(null) // 'slot-0','slot-1','slot-2','hotel'

  const photos = day.day_photos || []
  const getPhoto = (slot) => photos.find(p => p.slot_index === slot) || null

  const openPicker = (target) => {
    if (library.length === 0) {
      alert('Upload photos in the Photos tab first!')
      return
    }
    setPickerTarget(target)
  }

  const handlePickerSelect = (photo) => {
    if (pickerTarget === 'hotel') {
      setHotelPhoto(idx, photo)
    } else {
      const slot = parseInt(pickerTarget.replace('slot-', ''))
      setDayPhoto(idx, slot, photo)
    }
    setPickerTarget(null)
  }

  const addTag = (field, val) => {
    val = val.trim().replace(/,$/, '')
    if (!val) return
    const arr = day[field] || []
    if (!arr.includes(val)) updateDay(idx, field, [...arr, val])
  }

  const removeTag = (field, i) => {
    const arr = [...(day[field] || [])]
    arr.splice(i, 1)
    updateDay(idx, field, arr)
  }

  const toggleMeal = (meal) => {
    const meals = [...(day.meals || [])]
    const i = meals.indexOf(meal)
    if (i === -1) meals.push(meal)
    else meals.splice(i, 1)
    updateDay(idx, 'meals', meals)
  }

  return (
    <div className="day-card">
      {/* Header */}
      <div className="day-header" onClick={() => toggleDayOpen(idx)}>
        <div className="day-header-left">
          <div className="day-num">{idx + 1}</div>
          <input
            className="day-title-input"
            value={day.title || ''}
            placeholder={`Day ${idx + 1}: Enter title...`}
            onClick={e => e.stopPropagation()}
            onChange={e => updateDay(idx, 'title', e.target.value)}
          />
        </div>
        <div className="day-header-actions">
          <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); if (window.confirm('Remove this day?')) removeDay(idx) }}>🗑</button>
          <span className={`day-chevron ${day._open ? 'open' : ''}`}>▾</span>
        </div>
      </div>

      {/* Body */}
      <div className={`day-body ${day._open ? 'open' : ''}`}>

        {/* Activity Photos */}
        <div>
          <span className="day-field-label">Activity / Scene Photos (up to 3)</span>
          <div className="photo-grid-3">
            {[0, 1, 2].map(slot => {
              const ph = getPhoto(slot)
              return (
                <div key={slot} className="photo-slot" onClick={() => openPicker(`slot-${slot}`)}>
                  {ph ? (
                    <>
                      <img src={ph.photo_url} alt={ph.tag_name} />
                      <div className="photo-label">{ph.tag_name || ''}</div>
                      <button className="photo-remove" onClick={e => { e.stopPropagation(); removeDayPhoto(idx, slot) }}>✕</button>
                    </>
                  ) : (
                    <div className="photo-slot-add">+</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div className="field">
          <label>Day Description</label>
          <textarea
            value={day.description || ''}
            placeholder="Describe the day's activities..."
            onChange={e => updateDay(idx, 'description', e.target.value)}
          />
        </div>

        {/* Distance */}
        <div className="field">
          <label>Distance / Duration (optional)</label>
          <input
            value={day.distance || ''}
            placeholder="e.g. 97 KMS / 03:30 HRS one way"
            onChange={e => updateDay(idx, 'distance', e.target.value)}
          />
        </div>

        {/* Hotspots */}
        <div className="field">
          <label>Hotspots</label>
          <div className="tag-input-wrap">
            {(day.hotspots || []).map((h, i) => (
              <span key={i} className="tag">{h}
                <span className="tag-x" onClick={() => removeTag('hotspots', i)}>✕</span>
              </span>
            ))}
            <input
              placeholder="Type & Enter..."
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  addTag('hotspots', e.target.value)
                  e.target.value = ''
                  e.preventDefault()
                }
              }}
            />
          </div>
        </div>

        {/* Themes */}
        <div className="field">
          <label>Themes</label>
          <div className="tag-input-wrap">
            {(day.themes || []).map((t, i) => (
              <span key={i} className="tag green">{t}
                <span className="tag-x" onClick={() => removeTag('themes', i)}>✕</span>
              </span>
            ))}
            <input
              placeholder="e.g. Adventure, Sightseeing..."
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  addTag('themes', e.target.value)
                  e.target.value = ''
                  e.preventDefault()
                }
              }}
            />
          </div>
        </div>

        {/* Meals */}
        <div className="field">
          <label>Meals Included</label>
          <div className="check-group">
            {MEALS.map(m => (
              <label key={m} className={`check-pill ${(day.meals || []).includes(m) ? 'active' : ''}`}>
                <input type="checkbox"
                  checked={(day.meals || []).includes(m)}
                  onChange={() => toggleMeal(m)}
                />
                {m}
              </label>
            ))}
          </div>
        </div>

        {/* Accommodation */}
        <div className="grid-2">
          <div className="field">
            <label>Accommodation (Hotel Name)</label>
            <input
              value={day.accommodation || ''}
              placeholder="e.g. Hotel Mid Town Green"
              onChange={e => updateDay(idx, 'accommodation', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Stars</label>
            <div className="star-select">
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n}
                  className={(day.accom_star || 3) >= n ? 'on' : ''}
                  onClick={() => updateDay(idx, 'accom_star', n)}
                >★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Hotel Photo */}
        <div>
          <span className="day-field-label">Hotel Photo</span>
          <div className="photo-slot" style={{ aspectRatio: '16/7', width: '100%', borderRadius: 10 }}
            onClick={() => openPicker('hotel')}>
            {day.hotel_photo_url ? (
              <>
                <img src={day.hotel_photo_url} alt="Hotel" />
                <button className="photo-remove" onClick={e => { e.stopPropagation(); updateDay(idx, 'hotel_photo_url', null) }}>✕</button>
              </>
            ) : (
              <div className="photo-slot-add">🏨</div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Picker Modal */}
      {pickerTarget && (
        <div className="modal-overlay open" onClick={() => setPickerTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h3>📸 Select from Library</h3>
              <button className="modal-close" onClick={() => setPickerTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              {library.map(p => (
                <div key={p.id} className="picker-item" onClick={() => handlePickerSelect(p)}>
                  <img src={p.photo_url} alt={p.tag_name} />
                  <div className="picker-item-label">{p.tag_name}</div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setPickerTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
