// src/db/queries.js
// DB와 대화하는 창구 역할
// 다른 파일(collectors, routes)은 이 파일의 함수를 호출해서 데이터를 넣거나 꺼냄

import db from "./connection.js";

// ────────────────────────────────────────
// companies 테이블
// ────────────────────────────────────────

// 역할: companies 테이블의 모든 종목을 배열로 반환
// 사용: GET /api/companies 요청이 왔을 때 전체 목록 응답에 사용 (Phase 5)
export function getAllCompanies() {
  return db.prepare("SELECT * FROM companies").all();
}

// 역할: 새 종목을 companies 테이블에 저장
// 사용: 데이터 수집 시 종목 정보를 먼저 등록할 때 호출 (Phase 2)
// OR IGNORE: 같은 ticker가 이미 있으면 에러 없이 건너뜀 (중복 방지)
// @ticker, @name 등은 company 객체의 키를 자동으로 바인딩
//   → 호출 예: insertCompany({ ticker: 'AAPL', name: 'Apple', sector: 'Tech', industry: 'Electronics' })
export function insertCompany(company) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO companies (ticker, name, sector, industry)
       VALUES (@ticker, @name, @sector, @industry)`,
    )
    .run(company);
}

// name/sector/industry가 있을 때만 업데이트 (null로 덮어쓰지 않음)
export function getCompany(ticker) {
  return db.prepare('SELECT * FROM companies WHERE ticker = ?').get(ticker);
}

export function updateCompanyInfo(company) {
  return db
    .prepare(
      `UPDATE companies
       SET name     = COALESCE(@name, name),
           sector   = COALESCE(@sector, sector),
           industry = COALESCE(@industry, industry)
       WHERE ticker = @ticker`,
    )
    .run(company);
}

// ────────────────────────────────────────
// stock_prices 테이블
// ────────────────────────────────────────

// 역할: 하루치 주가 데이터(시가/고가/저가/종가/거래량)를 저장
// 사용: stockPrice.js가 API에서 주가를 받아온 후 호출 (Phase 2)
// OR IGNORE: 같은 종목의 같은 날짜 데이터가 이미 있으면 건너뜀
//   → 호출 예: insertStockPrice({ ticker:'AAPL', date:'2024-01-15', open:185, high:187, low:184, close:186, volume:52000000 })
export function insertStockPrice(data) {
  return db
    .prepare(
      `INSERT OR IGNORE INTO stock_prices (ticker, date, open, high, low, close, volume)
    VALUES (@ticker, @date, @open, @high, @low, @close, @volume)`,
    )
    .run(data);
}

// 역할: 특정 종목의 최근 N일 주가를 최신순으로 반환
// 사용: GET /api/companies/:ticker 상세 조회 시 최근 주가 포함할 때 (Phase 5)
// 매개변수: ticker(종목코드), limit(가져올 행 수, 기본값 5)
//   → 호출 예: getRecentPrices('AAPL', 3) → AAPL 최근 3일치 배열 반환
export function getRecentPrices(ticker, limit = 5) {
  return db
    .prepare(
      `SELECT date, close, volume
    FROM stock_prices
    WHERE ticker = ?
    ORDER BY date DESC
    LIMIT ?`,
    )
    .all(ticker, limit);
}

// ────────────────────────────────────────
// financials 테이블
// ────────────────────────────────────────

// 역할: 분기/연간 재무제표 원시 데이터(매출, 순이익, 총자산 등)를 저장
// 사용: financials.js가 API에서 재무제표를 받아온 후 호출 (Phase 2)
// OR IGNORE: 같은 종목의 같은 분기 데이터가 이미 있으면 건너뜀
//   → 호출 예: insertFinancials({ ticker:'AAPL', period:'2024Q4', revenue:119575000000, ... })
export function insertFinancials(data) {
  return db.prepare(`
    INSERT OR IGNORE INTO financials
      (ticker, period, revenue, net_income, total_assets, total_equity, total_debt, operating_income, shares_outstanding)
    VALUES
      (@ticker, @period, @revenue, @net_income, @total_assets, @total_equity, @total_debt, @operating_income, @shares_outstanding)
  `).run(data);
}

// ────────────────────────────────────────
// calculated_indicators 테이블
// ────────────────────────────────────────

// 역할: 계산된 재무 지표(PER, PBR, ROE 등)를 저장하거나 최신값으로 덮어씀
// 사용: indicators.js로 지표를 계산한 후 결과를 DB에 저장할 때 (Phase 3)
// OR REPLACE: 같은 (ticker, period)가 이미 있으면 기존 행을 지우고 새로 삽입
//   → IGNORE와 달리 덮어쓰기 → 재계산할 때마다 최신값 유지
//   → 호출 예: upsertIndicators({ ticker:'AAPL', period:'2024Q4', per:28.5, pbr:3.2, roe:15.4, ... })
export function upsertIndicators(data) {
  return db.prepare(`
    INSERT OR REPLACE INTO calculated_indicators
      (ticker, period, per, pbr, roe, roa, debt_ratio, op_margin)
    VALUES
      (@ticker, @period, @per, @pbr, @roe, @roa, @debt_ratio, @op_margin)
  `).run(data);
}

// 역할: 계산된 지표를 조회
// 사용1: ticker 지정 → GET /api/companies/:ticker 상세 조회 시 (Phase 5)
// 사용2: ticker 없음 → 전체 종목 지표를 가져와 벡터 유사도 계산 시 (Phase 4)
//   → 호출 예: getIndicators('AAPL') → AAPL의 지표 배열
//   → 호출 예: getIndicators()       → 전체 종목 지표 배열
export function getIndicators(ticker) {
  if (ticker) {
    return db.prepare(`
      SELECT * FROM calculated_indicators WHERE ticker = ?
    `).all(ticker);
  }
  return db.prepare(`SELECT * FROM calculated_indicators`).all();
}