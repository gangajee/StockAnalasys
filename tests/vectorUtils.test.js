// tests/vectorUtils.test.js
// [Phase 4] 벡터 유사도 함수 단위 테스트

import { zScoreNormalize, cosineSimilarity, findTopSimilar } from '../src/similarity/vectorUtils.js';

// ─────────────────────────────────────────
// cosineSimilarity
// ─────────────────────────────────────────
describe('cosineSimilarity', () => {
  test('동일 벡터 → 유사도 1', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  test('직교 벡터 → 유사도 0', () => {
    // [학습] [1,0]과 [0,1]은 내적이 0 → 방향이 완전히 다름
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test('영벡터 → 유사도 0', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  test('반대 방향 벡터 → 유사도 -1', () => {
    expect(cosineSimilarity([1, 2, 3], [-1, -2, -3])).toBeCloseTo(-1);
  });

  test('길이 다른 벡터 → 0', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});

// ─────────────────────────────────────────
// zScoreNormalize
// ─────────────────────────────────────────
describe('zScoreNormalize', () => {
  const rows = [
    { ticker: 'A', per: 10, pbr: 1, roe: 20, roa: 10, debt_ratio: 50, op_margin: 15 },
    { ticker: 'B', per: 20, pbr: 2, roe: 30, roa: 20, debt_ratio: 100, op_margin: 25 },
    { ticker: 'C', per: 30, pbr: 3, roe: 40, roa: 30, debt_ratio: 150, op_margin: 35 },
  ];

  test('반환 객체에 입력 모든 ticker가 포함됨', () => {
    const result = zScoreNormalize(rows);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['A', 'B', 'C']));
  });

  test('벡터 길이가 지표 수(6)와 같음', () => {
    const result = zScoreNormalize(rows);
    expect(result['A'].length).toBe(6);
  });

  test('중간값(B)의 z-score는 0에 가까움', () => {
    // 3개 값의 중간값은 평균이므로 z-score ≈ 0
    const result = zScoreNormalize(rows);
    result['B'].forEach((z) => expect(z).toBeCloseTo(0, 1));
  });

  test('null 값이 있어도 에러 없이 처리됨', () => {
    const withNull = [
      { ticker: 'X', per: null, pbr: 2, roe: 10, roa: 5, debt_ratio: 80, op_margin: 10 },
      { ticker: 'Y', per: 20,   pbr: 3, roe: 20, roa: 8, debt_ratio: 60, op_margin: 20 },
    ];
    expect(() => zScoreNormalize(withNull)).not.toThrow();
  });

  test('빈 배열 → 빈 객체', () => {
    expect(zScoreNormalize([])).toEqual({});
  });
});

// ─────────────────────────────────────────
// findTopSimilar
// ─────────────────────────────────────────
describe('findTopSimilar', () => {
  // [학습] 직접 vectorMap을 만들어 테스트 → DB 없이도 가능 (순수 함수의 장점)
  const vectorMap = {
    AAPL:  [1.2, 0.8, 1.5, 0.9, -0.5, 1.1],
    MSFT:  [1.1, 0.9, 1.4, 0.8, -0.4, 1.0],   // AAPL과 매우 유사
    GOOGL: [0.9, 0.7, 1.3, 1.0, -0.3, 0.8],
    META:  [-1.0, -0.5, -1.2, -0.8, 1.0, -0.9], // AAPL과 반대 패턴
  };

  test('상위 N개 유사 종목 반환', () => {
    const result = findTopSimilar('AAPL', vectorMap, 2);
    expect(result.length).toBe(2);
  });

  test('결과에 ticker와 similarity 필드가 있음', () => {
    const result = findTopSimilar('AAPL', vectorMap, 1);
    expect(result[0]).toHaveProperty('ticker');
    expect(result[0]).toHaveProperty('similarity');
  });

  test('자기 자신은 결과에 포함되지 않음', () => {
    const result = findTopSimilar('AAPL', vectorMap, 10);
    expect(result.map((r) => r.ticker)).not.toContain('AAPL');
  });

  test('유사도 내림차순 정렬 — MSFT가 META보다 앞에 옴', () => {
    const result = findTopSimilar('AAPL', vectorMap, 3);
    const msftIdx = result.findIndex((r) => r.ticker === 'MSFT');
    const metaIdx = result.findIndex((r) => r.ticker === 'META');
    expect(msftIdx).toBeLessThan(metaIdx);
  });

  test('존재하지 않는 ticker → 빈 배열', () => {
    expect(findTopSimilar('TSLA', vectorMap)).toEqual([]);
  });
});
