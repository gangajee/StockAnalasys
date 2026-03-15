// 지표 하나를 표시하는 작은 뱃지 컴포넌트
export default function StatBadge({ label, value, unit = '', highlight }) {
  const display = value == null ? 'N/A' : `${Number(value).toFixed(1)}${unit}`

  const color = highlight === 'per'
    ? value < 15 ? 'var(--green)' : value > 40 ? 'var(--red)' : 'var(--text)'
    : highlight === 'roe'
    ? value >= 20 ? 'var(--green)' : value < 5 ? 'var(--red)' : 'var(--text)'
    : 'var(--text)'

  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '8px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 80,
    }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontWeight: 600, fontSize: 15, color }}>
        {display}
      </span>
    </div>
  )
}
