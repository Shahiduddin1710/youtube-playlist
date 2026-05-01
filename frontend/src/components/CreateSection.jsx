import { useState } from 'react'
// import Field from './Field'
import RangeInput from './RangeInput'
import { IcPlaylist, IcPlay } from './Icons'

function buildRanges(rangeStr) {
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean)
  const result = []
  for (const part of parts) {
    const match = part.match(/^(\d+)-(\d+)$/)
    if (!match) return null
    result.push([parseInt(match[1]), parseInt(match[2])])
  }
  return result.length ? result : null
}

export default function CreateSection({ onLog }) {
  const [source, setSource]   = useState('')
  const [title, setTitle]     = useState('')
  const [range, setRange]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    onLog({ type: 'muted', text: '─'.repeat(52) })
    onLog({ type: 'info', text: 'Task: Create New Playlist' })

    if (!source.trim()) { onLog({ type: 'error', text: 'Source playlist URL is required' }); return }
    if (!title.trim())  { onLog({ type: 'error', text: 'Playlist name is required' }); return }

    const ranges = buildRanges(range)
    if (!ranges) { onLog({ type: 'error', text: `Invalid range: "${range}"` }); return }

    setLoading(true)
    onLog({ type: 'info', text: 'Connecting to backend...' })

    try {
const res = await fetch('http://localhost:5000/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, ranges, title, description: '', privacy: 'private' }),
      })
      const { job_id } = await res.json()

      const es = new EventSource(`http://localhost:5000/api/stream/${job_id}`)
      es.onmessage = (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'done') { es.close(); setLoading(false); return }
        onLog({ type: data.type, text: data.text })
      }
      es.onerror = () => {
        onLog({ type: 'error', text: 'Lost connection to backend' })
        es.close(); setLoading(false)
      }
    } catch {
      onLog({ type: 'error', text: 'Could not reach backend at localhost:5000' })
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
          background: 'rgba(79,142,247,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#4f8ef7', flexShrink: 0,
        }}>
          <IcPlaylist size={16} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.02em' }}>
          Create New Playlist
        </h2>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
            Source Playlist URL
          </label>
          <input
            type="text"
            placeholder="https://youtube.com/playlist?list=..."
            value={source}
            onChange={e => setSource(e.target.value)}
          />
          <span style={{ fontSize: '11px', color: '#444' }}>Enter the full YouTube URL of the source playlist.</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>
            Playlist Name
          </label>
          <input
            type="text"
            placeholder="e.g. My New AI Curation"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <span style={{ fontSize: '11px', color: '#444' }}>The title for your newly created playlist.</span>
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
            background: loading ? 'rgba(79,142,247,0.15)' : '#4f8ef7',
            border: '1px solid rgba(79,142,247,0.3)',
            borderRadius: '8px',
            color: loading ? '#4f8ef7' : '#fff',
            fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.15s',
            fontFamily: 'DM Sans, sans-serif',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#6fa3f9' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#4f8ef7' }}
        >
          {loading
            ? <><span style={{ width: '13px', height: '13px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Processing...</>
            : <><IcPlay size={13} /> Create Playlist</>
          }
        </button>
      </div>
    </div>
  )
} 