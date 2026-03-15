// src/similarity/vectorUtils.js
// [Phase 4] 벡터 유사도 알고리즘 (순수 함수)
//
// [학습] 왜 유사도 분석이 필요한가?
//   PER=28, ROE=30% 같은 숫자는 종목마다 단위와 크기가 다름
//   → 그냥 거리를 재면 큰 숫자(PER)가 작은 숫자(ROE%)를 압도함
//   → z-score로 "표준화" 후 코사인 유사도로 방향(패턴)을 비교

// ─────────────────────────────────────────
// z-score 정규화
// ─────────────────────────────────────────
// [학습] z-score = (값 - 평균) / 표준편차
//   → 모든 지표를 "평균 0, 표준편차 1"인 같은 척도로 맞춤
//   → null 값은 해당 지표의 평균으로 대체 (결측치 처리)
//
// 입력: [ { ticker, per, pbr, roe, roa, debt_ratio, op_margin }, ... ]
// 출력: { ticker: [z1, z2, z3, ...], ... }  ← 종목별 정규화 벡터
export function zScoreNormalize(rows) {
  if (!rows || rows.length === 0) return {};

  const FIELDS = ['per', 'pbr', 'roe', 'roa', 'debt_ratio', 'op_margin'];

  // 각 지표별 평균과 표준편차 계산 (null 제외)
  const stats = {};
  for (const field of FIELDS) {
    const values = rows.map((r) => r[field]).filter((v) => v != null);
    const mean = values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
    const variance = values.length > 1
      ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
      : 0;
    const std = Math.sqrt(variance);
    stats[field] = { mean, std };
  }

  // 종목별로 z-score 벡터 생성
  // [학습] std === 0이면 모든 값이 같다는 뜻 → 0으로 처리 (나누기 방지)
  const result = {};
  for (const row of rows) {
    result[row.ticker] = FIELDS.map((field) => {
      const value = row[field] ?? stats[field].mean; // null → 평균으로 대체
      const { mean, std } = stats[field];
      return std === 0 ? 0 : (value - mean) / std;
    });
  }

  return result;
}

// ─────────────────────────────────────────
// 코사인 유사도
// ─────────────────────────────────────────
// [학습] 코사인 유사도 = (A · B) / (|A| × |B|)
//   - 1에 가까울수록 두 벡터의 방향이 같음 (유사한 재무 패턴)
//   - 0: 무관계, -1: 완전 반대 패턴
//   - 크기(magnitude)가 아닌 방향만 비교 → 규모 차이에 강건함
//
// 입력: 숫자 배열 두 개 (길이 동일)
// 출력: -1 ~ 1 사이의 숫자
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0;       // 내적 (dot product)
  let magA = 0;      // |A|² 누적
  let magB = 0;      // |B|² 누적

  for (let i = 0; i < vecA.length; i++) {
    dot  += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  // [학습] 영벡터(모든 값 0)면 magnitude === 0 → 유사도 정의 불가 → 0 반환
  return magnitude === 0 ? 0 : dot / magnitude;
}

// ─────────────────────────────────────────
// 상위 N개 유사 종목 반환
// ─────────────────────────────────────────
// [학습] Object.entries()로 Map을 순회하며 대상 종목과 나머지를 비교
//
// 입력:
//   targetTicker  - 기준 종목 (예: 'AAPL')
//   vectorMap     - zScoreNormalize() 결과 { ticker: vector[] }
//   topN          - 반환할 종목 수 (기본 5)
// 출력:
//   [ { ticker, similarity }, ... ] 유사도 내림차순 정렬
export function findTopSimilar(targetTicker, vectorMap, topN = 5) {
  const targetVec = vectorMap[targetTicker];
  if (!targetVec) return [];

  return Object.entries(vectorMap)
    .filter(([ticker]) => ticker !== targetTicker)  // 자기 자신 제외
    .map(([ticker, vec]) => ({
      ticker,
      similarity: parseFloat(cosineSimilarity(targetVec, vec).toFixed(4)),
    }))
    .sort((a, b) => b.similarity - a.similarity)   // 유사도 내림차순
    .slice(0, topN);
}
