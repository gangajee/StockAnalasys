// src/collectors/financials.js
// [Phase 2] 재무제표 데이터 수집 모듈
// FMP API:
//   GET /income-statement?symbol=:ticker&apikey=...        → 매출, 순이익, 영업이익, 발행주식수
//   GET /balance-sheet-statement?symbol=:ticker&apikey=... → 총자산, 자기자본, 총부채

import axios from 'axios';
import 'dotenv/config';
import { insertCompany, insertFinancials } from '../db/queries.js';

const BASE_URL = process.env.API_BASE_URL;
const API_KEY  = process.env.API_KEY;

// [학습] period 문자열 변환: FMP의 fiscalYear + period → '2024FY' / '2024Q4' 형식
function formatPeriod(fiscalYear, period) {
  return `${fiscalYear}${period}`;
}

// [학습] Promise.all(): 두 API 호출을 동시에 날려 대기 시간 절반으로 단축
// → 순서가 없는 독립적인 요청은 await를 따로 쓰지 말고 Promise.all로 묶는 것이 좋음
export async function fetchAndSaveFinancials(ticker) {
  const [incomeRes, balanceRes] = await Promise.all([
    axios.get(`${BASE_URL}/income-statement?symbol=${ticker}&apikey=${API_KEY}`),
    axios.get(`${BASE_URL}/balance-sheet-statement?symbol=${ticker}&apikey=${API_KEY}`),
  ]);

  const incomeStatements  = incomeRes.data;   // 배열: 최신순 정렬
  const balanceStatements = balanceRes.data;  // 배열: 최신순 정렬

  if (!Array.isArray(incomeStatements) || incomeStatements.length === 0) {
    console.warn(`[financials] ${ticker}: 재무제표 데이터 없음`);
    return;
  }

  // companies 테이블에 종목 먼저 등록
  insertCompany({ ticker, name: null, sector: null, industry: null });

  // [학습] Map으로 balance sheet를 period 기준으로 인덱싱 → O(1) 조회
  // 두 배열을 period 키로 join하는 방식 (SQL의 JOIN과 동일한 개념)
  const balanceByPeriod = new Map(
    balanceStatements.map((b) => [formatPeriod(b.fiscalYear, b.period), b])
  );

  let savedCount = 0;
  for (const income of incomeStatements) {
    const period  = formatPeriod(income.fiscalYear, income.period);
    const balance = balanceByPeriod.get(period);

    // [학습] 옵셔널 체이닝(?.)으로 balance가 없을 때 undefined 반환 (에러 방지)
    // 발행주식수: income statement의 weightedAverageShsOut (기본 가중평균 주식수)
    const result = insertFinancials({
      ticker,
      period,
      revenue:            income.revenue             ?? null,
      net_income:         income.netIncome            ?? null,
      operating_income:   income.operatingIncome      ?? null,
      total_assets:       balance?.totalAssets        ?? null,
      total_equity:       balance?.totalStockholdersEquity ?? null,
      total_debt:         balance?.totalDebt          ?? null,
      shares_outstanding: income.weightedAverageShsOut ?? null,
    });

    if (result.changes > 0) savedCount++;
  }

  console.log(`[financials] ${ticker}: ${savedCount}건 저장 (전체 ${incomeStatements.length}건)`);
}
