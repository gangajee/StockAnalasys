import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }) {
  const { pathname } = useLocation()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
          📈 StockDash
        </Link>
        <nav style={{ display: 'flex', gap: 24 }}>
          <Link to="/" style={{ color: pathname === '/' ? 'var(--text)' : 'var(--muted)' }}>
            대시보드
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1, padding: '32px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
