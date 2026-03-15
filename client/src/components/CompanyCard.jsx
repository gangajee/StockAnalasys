import { useNavigate } from 'react-router-dom'
import StatBadge from './StatBadge'

const SECTOR_COLOR = {
  'Technology':             '#6c63ff',
  'Communication Services': '#06b6d4',
  'Consumer Cyclical':      '#f59e0b',
  'Financial Services':     '#10b981',
  'Healthcare':             '#ec4899',
}

export default function CompanyCard({ company }) {
  const navigate = useNavigate()
  const ind = company.latestIndicators

  return (
    <div
      onClick={() => navigate(`/company/${company.ticker}`)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {company.name ?? company.ticker}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
            {company.ticker}
          </div>
        </div>
        {company.sector && (
          <span style={{
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 20,
            background: `${SECTOR_COLOR[company.sector] ?? '#6c63ff'}22`,
            color: SECTOR_COLOR[company.sector] ?? 'var(--accent)',
            border: `1px solid ${SECTOR_COLOR[company.sector] ?? 'var(--accent)'}44`,
          }}>
            {company.sector}
          </span>
        )}
      </div>

      {/* 지표 뱃지 */}
      {ind ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatBadge label="PER"      value={ind.per}        highlight="per" />
          <StatBadge label="PBR"      value={ind.pbr} />
          <StatBadge label="ROE"      value={ind.roe}        unit="%" highlight="roe" />
          <StatBadge label="ROA"      value={ind.roa}        unit="%" />
          <StatBadge label="영업이익률" value={ind.op_margin}  unit="%" />
        </div>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>지표 없음</div>
      )}

      {/* 기간 */}
      {ind && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
          기준: {ind.period}
        </div>
      )}
    </div>
  )
}
