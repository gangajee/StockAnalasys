import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import CompanyCard from '../components/CompanyCard'

const SECTORS = ['전체', 'Technology', 'Communication Services', 'Consumer Cyclical', 'Financial Services', 'Healthcare']

export default function Dashboard() {
  const { data, loading, error } = useApi('/api/companies')
  const [sector, setSector] = useState('전체')
  const [search, setSearch] = useState('')

  const filtered = (data ?? []).filter(c => {
    const matchSector = sector === '전체' || c.sector === sector
    const matchSearch = c.ticker.toLowerCase().includes(search.toLowerCase()) ||
                        (c.name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchSector && matchSearch
  })

  return (
    <div>
      {/* 페이지 타이틀 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>주식 대시보드</h1>
        <p style={{ color: 'var(--muted)', marginTop: 4 }}>미국 주요 종목 재무 지표 한눈에 보기</p>
      </div>

      {/* 필터 바 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="종목 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 14px',
            color: 'var(--text)',
            fontSize: 14,
            outline: 'none',
            width: 200,
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTORS.map(s => (
            <button
              key={s}
              onClick={() => setSector(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid ' + (sector === s ? 'var(--accent)' : 'var(--border)'),
                background: sector === s ? 'var(--accent)' : 'transparent',
                color: sector === s ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
                fontSize: 13,
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 스탯 */}
      {data && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: '전체 종목', value: data.length },
            { label: '필터 결과', value: filtered.length },
            { label: '섹터 수', value: new Set(data.map(c => c.sector).filter(Boolean)).size },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 20px',
            }}>
              <div style={{ color: 'var(--muted)', fontSize: 12 }}>{stat.label}</div>
              <div style={{ fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* 상태 */}
      {loading && (
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>불러오는 중...</div>
      )}
      {error && (
        <div style={{ color: 'var(--red)', padding: 20 }}>에러: {error}</div>
      )}

      {/* 카드 그리드 */}
      {!loading && !error && (
        filtered.length === 0
          ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>결과 없음</div>
          : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}>
              {filtered.map(company => (
                <CompanyCard key={company.ticker} company={company} />
              ))}
            </div>
          )
      )}
    </div>
  )
}
