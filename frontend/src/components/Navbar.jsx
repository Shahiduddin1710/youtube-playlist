import { useState } from 'react'
import { IcSearch, IcUser } from './Icons'

const NAV_LINKS = ['Dashboard', 'History', 'Settings']

export default function Navbar() {
  const [active, setActive] = useState('Dashboard')

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(8,9,9,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 2.5l7 4.5-7 4.5V2.5z" fill="#080909"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '15px',
            color: 'var(--text-1)',
            letterSpacing: '-0.02em',
          }}>
            Playlist Automator
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {NAV_LINKS.map(link => (
            <button
              key={link}
              onClick={() => setActive(link)}
              style={{
                background: 'none',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13.5px',
                fontFamily: 'Geist, sans-serif',
                fontWeight: active === link ? 500 : 400,
                color: active === link ? 'var(--text-1)' : 'var(--text-2)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.15s',
              }}
            >
              {link}
              {active === link && (
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  left: '14px',
                  right: '14px',
                  height: '2px',
                  background: 'var(--accent)',
                  borderRadius: '1px',
                }}/>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-2)',
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            <IcSearch size={15} />
          </button>
          <button style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-2)',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <IcUser size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}