import { useParams, useNavigate } from 'react-router-dom'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useApi } from '../hooks/useApi'
import StatBadge from '../components/StatBadge'
import { getDisplayName } from '../utils/kospiNames'

const isKorean = ticker => ticker.endsWith('.KS') || ticker.endsWith('.KQ')

function calcMA(data, key, period) {
  return data.map((row, i) => {
    if (i < period - 1) return { ...row, [`ma${period}`]: null }
    const avg = data.slice(i - period + 1, i + 1).reduce((s, r) => s + r[key], 0) / period
    return { ...row, [`ma${period}`]: parseFloat(avg.toFixed(2)) }
  })
}

export default function CompanyDetail() {
  const { ticker } = useParams()
  const navigate = useNavigate()

  const { data: company, loading, error } = useApi(`/api/companies/${ticker}?prices=90`)
  const { data: similar } = useApi(`/api/recommend/${ticker}?top=5`)

  if (loading) return (
    <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 80 }}>불러오는 중...</div>
  )
  if (error) return (
    <div style={{ color: 'var(--red)', padding: 20 }}>에러: {error}</div>
  )
  if (!company) return null

  const korean = isKorean(ticker)
  const formatPrice = v => korean
    ? `₩${Math.round(v).toLocaleString()}`
    : `$${v.toFixed(2)}`

  const rawPrices = [...(company.recentPrices ?? [])].reverse()
  const withMA20 = calcMA(rawPrices, 'close', 20)
  const prices   = calcMA(withMA20, 'close', 60)

  const latest      = company.indicators?.[0]
  const latestPrice = company.recentPrices?.[0]?.close
  const oldPrice    = rawPrices[0]?.close
  const priceDiff   = latestPrice && oldPrice
    ? (((latestPrice - oldPrice) / oldPrice) * 100).toFixed(2)
    : null

  const displayName = getDisplayName(ticker, company.name)

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, marginBottom: 20, padding: 0 }}
      >
        ← 대시보드로
      </button>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{displayName}</h1>
            {priceDiff !== null && (
              <span style={{ color: priceDiff >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                {priceDiff >= 0 ? '+' : ''}{priceDiff}% (90일)
              </span>
            )}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 3 }}>
            {ticker}{latest ? ` · ${latest.period}` : ''}
          </div>
        </div>
        {latestPrice && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatPrice(latestPrice)}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>현재가 (최근 종가)</div>
          </div>
        )}
      </div>

      {/* 지표 뱃지 */}
      {latest && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
          <StatBadge label="PER"       value={latest.per}        highlight="per" />
          <StatBadge label="PBR"       value={latest.pbr} />
          <StatBadge label="ROE"       value={latest.roe}        unit="%" highlight="roe" />
          <StatBadge label="ROA"       value={latest.roa}        unit="%" />
          <StatBadge label="부채비율"   value={latest.debt_ratio} unit="%" />
          <StatBadge label="영업이익률" value={latest.op_margin}  unit="%" />
        </div>
      )}

      {/* 주가 차트 */}
      {prices.length > 0 && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>주가 (최근 90일)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={prices} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                tickFormatter={d => d.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={v => korean ? `₩${(v / 1000).toFixed(0)}K` : `$${v}`}
                width={korean ? 65 : 55}
              />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--muted)', marginBottom: 4 }}
                formatter={(v, name) => {
                  const labels = { close: '종가', ma20: 'MA20', ma60: 'MA60' }
                  return [v != null ? formatPrice(v) : '-', labels[name] ?? name]
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={name => ({ close: '종가', ma20: 'MA20', ma60: 'MA60' }[name] ?? name)}
              />
              <Area type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
              <Line type="monotone" dataKey="ma20" stroke="#facc15" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="ma60" stroke="#f87171" strokeWidth={1.5} dot={false} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* 유사 종목 */}
      {similar?.similar?.length > 0 && (
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>유사 종목</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {similar.similar.map((s, i) => (
              <div
                key={s.ticker}
                onClick={() => navigate(`/company/${s.ticker}`)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12, width: 16 }}>#{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {getDisplayName(s.ticker, s.name)}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 11, marginTop: 1 }}>{s.ticker}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    height: 6,
                    width: `${Math.max(0, s.similarity * 80)}px`,
                    background: 'var(--accent)',
                    borderRadius: 3,
                    minWidth: 4,
                  }} />
                  <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600, width: 50, textAlign: 'right' }}>
                    {(s.similarity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
