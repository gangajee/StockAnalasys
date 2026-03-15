// src/calculators/saveIndicators.js
// [Phase 3] 재무제표 + 최신 주가 → 지표 계산 → DB 저장
//
// [학습] 이 파일의 역할: "조율자(orchestrator)"
//   - DB에서 데이터를 읽고
//   - 순수 함수(indicators.js)에 넘겨 계산하고
//   - 결과를 다시 DB에 저장
//   - 직접 계산하지 않으므로 테스트는 indicators.test.js에서 완결됨

import { calcAllIndicators } from './indicators.js';
import { getRecentPrices, getIndicators, upsertIndicators } from '../db/queries.js';
import db from '../db/connection.js';

// 모든 종목의 최신 재무제표를 기반으로 지표를 계산해 DB에 저장
// [학습] 집계 쿼리: GROUP BY + MAX()로 각 종목의 최신 기간만 가져옴
export function calcAndSaveAllIndicators() {
  // financials 테이블에서 각 ticker의 최신 period만 추출
  const rows = db.prepare(`
    SELECT f.*
    FROM financials f
    INNER JOIN (
      SELECT ticker, MAX(period) AS latest_period
      FROM financials
      GROUP BY ticker
    ) latest ON f.ticker = latest.ticker AND f.period = latest.latest_period
  `).all();

  if (rows.length === 0) {
    console.warn('[saveIndicators] financials 테이블에 데이터 없음');
    return;
  }

  let savedCount = 0;

  for (let row of rows) {
    // shares_outstanding이 null이면 이전 기간의 값으로 폴백
    if (row.shares_outstanding == null) {
      const prev = db.prepare(`
        SELECT shares_outstanding FROM financials
        WHERE ticker = ? AND period < ? AND shares_outstanding IS NOT NULL
        ORDER BY period DESC LIMIT 1
      `).get(row.ticker, row.period);
      if (prev) row = { ...row, shares_outstanding: prev.shares_outstanding };
    }

    // 최신 종가(close)를 현재 주가로 사용
    const priceRows = getRecentPrices(row.ticker, 1);
    const price = priceRows.length > 0 ? priceRows[0].close : null;

    if (price === null) {
      console.warn(`[saveIndicators] ${row.ticker}: 주가 데이터 없음 → 건너뜀`);
      continue;
    }

    // [학습] calcAllIndicators는 순수 함수 → 같은 입력이면 항상 같은 결과
    const indicators = calcAllIndicators({
      price,
      netIncome:         row.net_income,
      totalEquity:       row.total_equity,
      totalAssets:       row.total_assets,
      totalDebt:         row.total_debt,
      operatingIncome:   row.operating_income,
      revenue:           row.revenue,
      sharesOutstanding: row.shares_outstanding,
    });

    // [학습] OR REPLACE: 이미 같은 (ticker, period)가 있으면 덮어씀 → 재실행해도 안전
    upsertIndicators({
      ticker:     row.ticker,
      period:     row.period,
      per:        indicators.per,
      pbr:        indicators.pbr,
      roe:        indicators.roe,
      roa:        indicators.roa,
      debt_ratio: indicators.debtRatio,
      op_margin:  indicators.opMargin,
    });

    savedCount++;
    console.log(
      `[saveIndicators] ${row.ticker} (${row.period}) ` +
      `PER=${indicators.per?.toFixed(1) ?? 'N/A'} ` +
      `ROE=${indicators.roe?.toFixed(1) ?? 'N/A'}%`
    );
  }

  console.log(`[saveIndicators] 완료: ${savedCount}/${rows.length}건 저장`);
}

// 특정 ticker만 계산
export function calcAndSaveIndicators(ticker) {
  const row = db.prepare(`
    SELECT * FROM financials
    WHERE ticker = ?
    ORDER BY period DESC
    LIMIT 1
  `).get(ticker);

  if (!row) {
    console.warn(`[saveIndicators] ${ticker}: 재무제표 없음`);
    return;
  }

  const priceRows = getRecentPrices(ticker, 1);
  const price = priceRows.length > 0 ? priceRows[0].close : null;

  if (price === null) {
    console.warn(`[saveIndicators] ${ticker}: 주가 없음`);
    return;
  }

  const indicators = calcAllIndicators({
    price,
    netIncome:         row.net_income,
    totalEquity:       row.total_equity,
    totalAssets:       row.total_assets,
    totalDebt:         row.total_debt,
    operatingIncome:   row.operating_income,
    revenue:           row.revenue,
    sharesOutstanding: row.shares_outstanding,
  });

  upsertIndicators({
    ticker,
    period:     row.period,
    per:        indicators.per,
    pbr:        indicators.pbr,
    roe:        indicators.roe,
    roa:        indicators.roa,
    debt_ratio: indicators.debtRatio,
    op_margin:  indicators.opMargin,
  });

  return indicators;
}
