import { IcRange } from './Icons'

export default function RangeInput({ value, onChange, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{
        fontSize: '10.5px',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'Geist, sans-serif',
      }}>
        <span style={{ color: 'var(--text-3)', display: 'flex' }}><IcRange size={14} /></span>
        Index Range
      </label>

      <input
        type="text"
        placeholder="1-10,14-20"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '9px 13px',
          fontSize: '13px',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-1)',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          caretColor: 'var(--accent)',
          boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'var(--surface-3)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface-2)' }}
      />

      {hint && (
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'Geist', lineHeight: 1.4 }}>
          {hint}
        </span>
      )}
    </div>
  )
}