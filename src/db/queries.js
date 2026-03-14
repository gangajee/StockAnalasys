// src/db/queries.js
// [Phase 1] SQL 쿼리 함수 모음 (ORM 미사용, 순수 SQL)
// TODO: 각 테이블별 CRUD 함수 구현

// TODO: companies 관련 쿼리
export function getAllCompanies() {}
export function insertCompany(company) {}

// TODO: stock_prices 관련 쿼리
export function insertStockPrice(data) {}
export function getRecentPrices(ticker, limit = 5) {}

// TODO: financials 관련 쿼리
export function insertFinancials(data) {}

// TODO: calculated_indicators 관련 쿼리
export function upsertIndicators(data) {}
export function getIndicators(ticker) {}