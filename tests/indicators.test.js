// tests/indicators.test.js
// [Phase 2] 재무 지표 계산 함수 단위 테스트
//
// [학습] 단위 테스트란?
//   - 함수 하나가 "올바르게" 작동하는지 증명하는 문서
//   - 정상 케이스뿐 아니라 엣지 케이스(0, null, 음수)까지 검증해야 함
//   - 테스트가 통과 = 함수가 계약대로 작동한다는 보증

import {
  calcEPS,
  calcPER,
  calcPBR,
  calcROE,
  calcROA,
  calcDebtRatio,
  calcOpMargin,
  calcAllIndicators,
} from '../src/calculators/indicators.js';

// ─────────────────────────────────────────
// calcEPS
// ─────────────────────────────────────────
describe('calcEPS', () => {
  test('정상: 순이익 10000, 주식수 100 → EPS 100', () => {
    expect(calcEPS(10000, 100)).toBe(100);
  });

  test('정상: 순이익이 음수(적자)여도 계산함 → -50', () => {
    // EPS 자체는 음수가 될 수 있음. PER에서 null 처리함
    expect(calcEPS(-5000, 100)).toBe(-50);
  });

  test('엣지: 주식수 0 → null', () => {
    expect(calcEPS(10000, 0)).toBeNull();
  });

  test('엣지: 주식수 null → null', () => {
    expect(calcEPS(10000, null)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcPER
// ─────────────────────────────────────────
describe('calcPER', () => {
  // [학습] toBeCloseTo: 부동소수점 오차를 허용하며 비교 (소수점 2자리까지)
  test('정상: 주가 5000, 순이익 5000, 주식수 10 → PER 10', () => {
    // EPS = 5000 / 10 = 500, PER = 5000 / 500 = 10
    expect(calcPER(5000, 5000, 10)).toBeCloseTo(10);
  });

  test('엣지: 적자 기업(순이익 음수) → null', () => {
    expect(calcPER(50000, -1000, 10)).toBeNull();
  });

  test('엣지: EPS가 0 (순이익 0) → null', () => {
    expect(calcPER(50000, 0, 10)).toBeNull();
  });

  test('엣지: 주식수 0 → null', () => {
    expect(calcPER(50000, 5000, 0)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcPBR
// ─────────────────────────────────────────
describe('calcPBR', () => {
  test('정상: 주가 30000, 자기자본 150000, 주식수 10 → PBR 2', () => {
    expect(calcPBR(30000, 150000, 10)).toBeCloseTo(2);
  });

  test('엣지: BPS가 0 (자기자본 0) → null', () => {
    expect(calcPBR(30000, 0, 10)).toBeNull();
  });

  test('엣지: 주식수 null → null', () => {
    expect(calcPBR(30000, 150000, null)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcROE
// ─────────────────────────────────────────
describe('calcROE', () => {
  test('정상: 순이익 2000, 자기자본 10000 → ROE 20%', () => {
    expect(calcROE(2000, 10000)).toBeCloseTo(20);
  });

  test('정상: 순이익 음수(적자) → ROE도 음수', () => {
    expect(calcROE(-1000, 10000)).toBeCloseTo(-10);
  });

  test('엣지: 자기자본 0 → null', () => {
    expect(calcROE(2000, 0)).toBeNull();
  });

  test('엣지: 자기자본 null → null', () => {
    expect(calcROE(2000, null)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcROA
// ─────────────────────────────────────────
describe('calcROA', () => {
  test('정상: 순이익 3000, 총자산 100000 → ROA 3%', () => {
    expect(calcROA(3000, 100000)).toBeCloseTo(3);
  });

  test('엣지: 총자산 0 → null', () => {
    expect(calcROA(3000, 0)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcDebtRatio
// ─────────────────────────────────────────
describe('calcDebtRatio', () => {
  test('정상: 총부채 50000, 자기자본 100000 → 부채비율 50%', () => {
    expect(calcDebtRatio(50000, 100000)).toBeCloseTo(50);
  });

  test('엣지: 자기자본 0 → null', () => {
    expect(calcDebtRatio(50000, 0)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcOpMargin
// ─────────────────────────────────────────
describe('calcOpMargin', () => {
  test('정상: 영업이익 1500, 매출 10000 → 영업이익률 15%', () => {
    expect(calcOpMargin(1500, 10000)).toBeCloseTo(15);
  });

  test('엣지: 매출 0 → null', () => {
    expect(calcOpMargin(1500, 0)).toBeNull();
  });
});

// ─────────────────────────────────────────
// calcAllIndicators
// ─────────────────────────────────────────
describe('calcAllIndicators', () => {
  const sampleData = {
    price:            50000,
    netIncome:        5000,
    totalEquity:      25000,
    totalAssets:     100000,
    totalDebt:        10000,
    operatingIncome:   6000,
    revenue:          40000,
    sharesOutstanding:   10,
  };

  test('정상: 모든 지표가 숫자로 반환됨', () => {
    const result = calcAllIndicators(sampleData);

    // [학습] expect.objectContaining: 객체가 특정 키를 포함하는지 검사
    expect(result).toEqual(
      expect.objectContaining({
        eps: expect.any(Number),
        per: expect.any(Number),
        pbr: expect.any(Number),
        roe: expect.any(Number),
        roa: expect.any(Number),
        debtRatio: expect.any(Number),
        opMargin: expect.any(Number),
      })
    );
  });

  test('정상: 각 지표 값이 올바르게 계산됨', () => {
    const result = calcAllIndicators(sampleData);

    expect(result.eps).toBeCloseTo(500);        // 5000 / 10
    expect(result.per).toBeCloseTo(100);        // 50000 / 500
    expect(result.roe).toBeCloseTo(20);         // 5000 / 25000 * 100
    expect(result.roa).toBeCloseTo(5);          // 5000 / 100000 * 100
    expect(result.debtRatio).toBeCloseTo(40);   // 10000 / 25000 * 100
    expect(result.opMargin).toBeCloseTo(15);    // 6000 / 40000 * 100
  });

  test('엣지: 적자 기업이면 per은 null, 나머지는 계산됨', () => {
    const result = calcAllIndicators({ ...sampleData, netIncome: -1000 });

    expect(result.per).toBeNull();
    expect(result.roe).toBeCloseTo(-4);  // -1000 / 25000 * 100
  });
});
