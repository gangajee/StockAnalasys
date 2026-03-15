// src/calculators/indicators.js
// [Phase 2] 재무 지표 순수 함수 모음
//
// [학습] 순수 함수(pure function)란?
//   - 동일한 입력 → 항상 동일한 출력
//   - 함수 밖의 상태를 읽거나 바꾸지 않음 (부수효과 없음)
//   - 테스트하기 쉽고, 버그 추적이 쉬움

// ─────────────────────────────────────────
// EPS: 주당순이익 = 순이익 ÷ 발행주식수
// ─────────────────────────────────────────
// [학습] 방어적 프로그래밍: 잘못된 입력은 null 반환 (에러 던지지 않음)
// 이유: 데이터 누락이 흔한 재무 도메인에서 null은 "계산 불가"를 의미
export function calcEPS(netIncome, sharesOutstanding) {
  if (sharesOutstanding == null || sharesOutstanding <= 0) return null;
  return netIncome / sharesOutstanding;
}

// ─────────────────────────────────────────
// PER: 주가수익비율 = 현재 주가 ÷ EPS
// ─────────────────────────────────────────
// [학습] 함수 재사용: calcEPS를 호출해서 결과를 받아 쓴다
// 적자 기업(EPS <= 0)은 PER이 의미 없으므로 null 반환
export function calcPER(price, netIncome, sharesOutstanding) {
  const eps = calcEPS(netIncome, sharesOutstanding);
  if (eps === null || eps <= 0) return null;
  return price / eps;
}

// ─────────────────────────────────────────
// BPS: 주당순자산 = 자기자본 ÷ 발행주식수
// PBR: 주가순자산비율 = 현재 주가 ÷ BPS
// ─────────────────────────────────────────
export function calcPBR(price, totalEquity, sharesOutstanding) {
  if (sharesOutstanding == null || sharesOutstanding <= 0) return null;
  const bps = totalEquity / sharesOutstanding;
  // [학습] bps === 0이면 0으로 나누기 발생 → null
  if (bps === 0) return null;
  return price / bps;
}

// ─────────────────────────────────────────
// ROE: 자기자본이익률 = 순이익 ÷ 자기자본 × 100  (단위: %)
// ─────────────────────────────────────────
export function calcROE(netIncome, totalEquity) {
  if (totalEquity == null || totalEquity === 0) return null;
  return (netIncome / totalEquity) * 100;
}

// ─────────────────────────────────────────
// ROA: 총자산이익률 = 순이익 ÷ 총자산 × 100  (단위: %)
// ─────────────────────────────────────────
export function calcROA(netIncome, totalAssets) {
  if (totalAssets == null || totalAssets <= 0) return null;
  return (netIncome / totalAssets) * 100;
}

// ─────────────────────────────────────────
// 부채비율 = 총부채 ÷ 자기자본 × 100  (단위: %)
// ─────────────────────────────────────────
// [학습] 자기자본이 음수(자본잠식)이면 계산은 되지만 해석 주의
export function calcDebtRatio(totalDebt, totalEquity) {
  if (totalEquity == null || totalEquity === 0) return null;
  return (totalDebt / totalEquity) * 100;
}

// ─────────────────────────────────────────
// 영업이익률 = 영업이익 ÷ 매출 × 100  (단위: %)
// ─────────────────────────────────────────
export function calcOpMargin(operatingIncome, revenue) {
  if (revenue == null || revenue === 0) return null;
  return (operatingIncome / revenue) * 100;
}

// ─────────────────────────────────────────
// 일괄 계산 함수
// ─────────────────────────────────────────
// [학습] 구조 분해 할당(destructuring): 객체에서 필요한 값만 꺼내 쓴다
// [학습] 이 함수는 위의 함수들을 조합만 할 뿐 직접 계산하지 않음 → 단일 책임 원칙
export function calcAllIndicators({
  price,
  netIncome,
  totalEquity,
  totalAssets,
  totalDebt,
  operatingIncome,
  revenue,
  sharesOutstanding,
}) {
  return {
    eps:       calcEPS(netIncome, sharesOutstanding),
    per:       calcPER(price, netIncome, sharesOutstanding),
    pbr:       calcPBR(price, totalEquity, sharesOutstanding),
    roe:       calcROE(netIncome, totalEquity),
    roa:       calcROA(netIncome, totalAssets),
    debtRatio: calcDebtRatio(totalDebt, totalEquity),
    opMargin:  calcOpMargin(operatingIncome, revenue),
  };
}