import { useEffect, useRef, useState } from 'react'
import { IconTerminal, IconTrash, IconCopy, IconCheck } from './Icons'

const TYPE_STYLES = {
  info:    { color: 'var(--text-secondary)', icon: '·' },
  success: { color: 'var(--green)',          icon: '✓' },
  error:   { color: 'var(--red)',            icon: '✗' },
  warn:    { color: 'var(--yellow)',         icon: '!' },
  data:    { color: 'var(--accent-hover)',   icon: '→' },
  muted:   { color: 'var(--text-muted)',     icon: ' ' },
}

function LogLine({ entry, index }) {
  const style = TYPE_STYLES[entry.type] || TYPE_STYLES.info
  return (
    <div
      className="log-line"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '3px 0',
        animationDelay: `${index * 0.02}s`,
        opacity: 0,
        animationFillMode: 'forwards',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'DM Mono', minWidth: '44px', paddingTop: '1px', userSelect: 'none' }}>
        {entry.time}
      </span>
      <span style={{ color: style.color, fontSize: '12px', minWidth: '10px', userSelect: 'none' }}>
        {style.icon}
      </span>
      <span style={{ color: style.color, fontSize: '13px', fontFamily: 'DM Mono', lineHeight: '1.6', wordBreak: 'break-all' }}>
        {entry.text}
      </span>
    </div>
  )
}

export default function Terminal({ logs, onClear }) {
  const bottomRef = useRef(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const handleCopy = () => {
    const text = logs.map(l => `[${l.time}] ${l.text}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
 <div
      style={{
        background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: '#0f0f0f',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            <IconTerminal size={14} />
          </span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
            Terminal Console
          </span>
          {logs.length > 0 && (
            <span style={{
              fontSize: '10px',
              background: 'var(--accent-dim)',
              color: 'var(--accent-hover)',
              padding: '1px 7px',
              borderRadius: '20px',
              fontFamily: 'DM Mono',
            }}>
              {logs.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {logs.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                title="Copy logs"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: copied ? 'var(--green)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={onClear}
                title="Clear logs"
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--red)'
                  e.currentTarget.style.color = 'var(--red)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <IconTrash size={12} />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

     <div
        style={{
          height: '320px',
          overflowY: 'auto',
          padding: '16px',
          fontFamily: 'DM Mono, monospace',
          background: '#0a0a0a',
        }}
      >
        {logs.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: 'var(--text-muted)',
          }}>
            <IconTerminal size={24} />
            <span style={{ fontSize: '12px' }}>Waiting for output...</span>
          </div>
        ) : (
          <>
            {logs.map((entry, i) => (
              <LogLine key={entry.id} entry={entry} index={i} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  )
}
