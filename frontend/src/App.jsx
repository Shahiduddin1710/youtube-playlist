import { useState, useCallback } from 'react'
import CreateSection from './components/CreateSection'
import ExistingSection from './components/ExistingSection'
import Terminal from './components/Terminal'

let logCounter = 0

export default function App() {
  const [logs, setLogs] = useState([])

  const addLog = useCallback((entry) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setLogs(prev => [...prev, { ...entry, time, id: ++logCounter }])
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return (
  <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <div style={{
        padding: '32px 32px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#f0f0f0',
          letterSpacing: '-0.03em',
          marginBottom: '6px',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          Automation Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: '#555', fontFamily: 'DM Sans, sans-serif' }}>
          Configure your high-performance playlist synchronization workflows.
        </p>
      </div>

      <div style={{ padding: '0 32px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}>
          <CreateSection onLog={addLog} />
          <ExistingSection onLog={addLog} />
        </div>

        <Terminal logs={logs} onClear={clearLogs} />
      </div>
    </div>
  )
}
