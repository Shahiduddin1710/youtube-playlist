import { useState } from 'react'
import {  IcArrow } from './Icons'
import RangeInput from './RangeInput'
function parseRanges(raw) {
  if (!raw.trim()) return null
  const parts = raw.split(',').map(s => s.trim())
  const result = []
  for (const part of parts) {
    const match = part.match(/^(\d+)-(\d+)$/)
    if (!match) return null
    result.push([parseInt(match[1]), parseInt(match[2])])
  }
  return result
}

export default function ExistingSection({ onLog }) {
  const [source, setSource] = useState('')
  const [destination, setDest] = useState('')
  const [range, setRange] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    onLog({ type: 'muted', text: '─'.repeat(48) })
    onLog({ type: 'info', text: 'Task: Continue Into Existing Playlist' })

    if (!source.trim()) {
      onLog({ type: 'error', text: 'Source playlist URL is required' })
      return
    }
    if (!destination.trim()) {
      onLog({ type: 'error', text: 'Destination playlist URL or ID is required' })
      return
    }

    const ranges = parseRanges(range)
    if (!ranges) {
      onLog({ type: 'error', text: `Invalid range format: "${range}" — expected e.g. 3-40,71-90` })
      return
    }

    setLoading(true)
const res = await fetch('http://localhost:5000/api/existing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination, ranges }),
    })
    const { job_id } = await res.json()

   const es = new EventSource(`http://localhost:5000/api/stream/${job_id}`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'done') {
        es.close()
        setLoading(false)
        return
      }
      onLog({ type: data.type, text: data.text })
    }

    es.onerror = () => {
      onLog({ type: 'error', text: 'Lost connection to backend' })
      es.close()
      setLoading(false)
    }
  }

 return (
    <div style={{
      background: '#111',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'rgba(62,207,142,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#3ecf8e', flexShrink: 0,
        }}>
          <IcArrow size={16} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.02em' }}>
          Continue Into Existing Playlist
        </h2>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
            Source Playlist URL
          </label>
          <input
            type="text"
            placeholder="https://youtube.com/playlist?list=SOURCE"
            value={source}
            onChange={e => setSource(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
            Destination Playlist URL
          </label>
          <input
            type="text"
            placeholder="https://youtube.com/playlist?list=DESTINATION"
            value={destination}
            onChange={e => setDest(e.target.value)}
          />
          <span style={{ fontSize: '11px', color: '#444' }}>Your existing target playlist URL or ID</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
            Index Range
          </label>
          <RangeInput value={range} onChange={setRange} hint="Comma-separated ranges, e.g. 3-82,105-119" />
        </div>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: '#f0f0f0',
            fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.15s',
            fontFamily: 'DM Sans, sans-serif',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        >
          {loading ? (
            <><span style={{ width: '13px', height: '13px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Processing...</>
          ) : (
            <><IcArrow size={13} /> Start Transfer</>
          )}
        </button>
      </div>
    </div>
  )
}