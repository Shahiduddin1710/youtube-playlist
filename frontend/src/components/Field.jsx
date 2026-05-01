export default function Field({ label, icon, placeholder, value, onChange, hint, type = 'text' }) {
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
        {icon && <span style={{ color: 'var(--text-3)', display: 'flex' }}>{icon}</span>}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '9px 13px',
          fontSize: '13px',
          fontFamily: 'JetBrains Mono, monospace',
          fontWeight: 400,
          color: 'var(--text-1)',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s',
          caretColor: 'var(--accent)',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--accent)'
          e.target.style.background = 'var(--surface-3)'
        }}
        onBlur={e => {
          e.target.style.borderColor = 'var(--border)'
          e.target.style.background = 'var(--surface-2)'
        }}
      />
      {hint && (
        <span style={{
          fontSize: '11px',
          color: 'var(--text-3)',
          fontFamily: 'Geist, sans-serif',
          lineHeight: 1.4,
        }}>
          {hint}
        </span>
      )}
    </div>
  )
}